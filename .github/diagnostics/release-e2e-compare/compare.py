#!/usr/bin/env python3
"""Run the fixed trace comparison one GitHub workflow step at a time."""
from datetime import datetime, timezone
import base64
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import threading
import time
import traceback
import zipfile
import signal

CODE = Path(__file__).resolve().parent
ROOT = Path(os.environ['COMPARE_ROOT']).resolve()
PINS = json.loads((CODE / 'pins.json').read_text())
DOCKER = ['/usr/bin/docker']
PREFIX = 'e2e-github-' + os.environ['GITHUB_RUN_ID'] + '-' + os.environ['GITHUB_RUN_ATTEMPT']
if not re.fullmatch(r'e2e-github-[0-9]+-[0-9]+', PREFIX):
    raise RuntimeError('Invalid run identity')
LABEL = 'codex.task=' + PREFIX
CONTROLLER = ROOT / 'controller'
ORDER = ['A', 'B', 'B', 'A', 'A', 'B']
STATE = {'started': None, 'phase': 'prepare', 'trials': [], 'inventories': {}}
RESOURCES = {'containers': set(), 'networks': set()}


def now():
    return datetime.now(timezone.utc).isoformat()


def save(path, value):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, indent=2) + '\n')
    temporary.replace(path)


def status(phase):
    STATE['phase'] = phase
    STATE['updated'] = now()
    save(ROOT / 'status.json', STATE)
    print(now(), phase, flush=True)


def docker(*args):
    return subprocess.check_output([*DOCKER, *args], text=True, timeout=30)


def run(args, log, *, env=None, cwd=ROOT, timeout=5400):
    started = time.monotonic()
    with log.open('w') as f:
        p = subprocess.run(args, stdout=f, stderr=subprocess.STDOUT, env=env,
                           cwd=cwd, timeout=timeout)
    return {'exit_code': p.returncode, 'seconds': round(time.monotonic() - started, 3)}


def source_manifest(ui):
    return (ROOT / 'source-sha256.txt').read_text()


def create_network(name):
    docker('network', 'create', '--label', LABEL, name)
    RESOURCES['networks'].add(name)



def remove_resources():
    errors = []
    for kind, args in [('containers', ['ps', '-a']), ('networks', ['network', 'ls'])]:
        names = docker(*args, '--filter', 'label=' + LABEL, '--format', '{{.Names}}' if kind == 'containers' else '{{.Name}}').splitlines()
        RESOURCES[kind].update(names)
    for kind in ['containers', 'networks']:
        for name in sorted(RESOURCES[kind]):
            inspect = [*DOCKER, *(['network'] if kind == 'networks' else []), 'inspect', name]
            p = subprocess.run(inspect, capture_output=True, text=True)
            if p.returncode:
                if 'no such' in p.stderr.lower() or 'not found' in p.stderr.lower():
                    continue
                errors.append(p.stderr)
                continue
            data = json.loads(p.stdout)[0]
            labels = data.get('Labels') if kind == 'networks' else data['Config'].get('Labels')
            if (labels or {}).get('codex.task') != PREFIX:
                errors.append('Refusing removal without ownership label: ' + name)
                continue
            args = ['network', 'rm', name] if kind == 'networks' else ['rm', '-f', '-v', name]
            p = subprocess.run([*DOCKER, *args], capture_output=True, text=True)
            if p.returncode:
                errors.append(p.stderr)
    left = {
        'containers': docker('ps', '-a', '--filter', 'label=' + LABEL, '--format', '{{.Names}}').splitlines(),
        'networks': docker('network', 'ls', '--filter', 'label=' + LABEL, '--format', '{{.Name}}').splitlines(),
        'volumes': docker('volume', 'ls', '--filter', 'label=' + LABEL, '--format', '{{.Name}}').splitlines(),
    }
    save(ROOT / 'cleanup.json', {'at': now(), 'remaining': left, 'errors': errors})
    if errors or any(left.values()):
        raise RuntimeError('Task cleanup failed: ' + json.dumps({'errors': errors, 'remaining': left}))
    RESOURCES['containers'].clear()
    RESOURCES['networks'].clear()


def backend(image_name, trial, network, out):
    name = PREFIX + '-' + trial + '-ydb'
    image = 'ghcr.io/ydb-platform/local-ydb@' + PINS['images'][image_name]['digest']
    RESOURCES['containers'].add(name)
    docker('run', '-d', '--rm', '--platform', 'linux/amd64', '--name', name,
           '--label', LABEL, '--network', network, '--hostname', 'localhost',
           '--cpuset-cpus', '0-3', '--memory', '4g', '--memory-swap', '4g',
           '-e', 'YDB_ALLOW_ORIGIN=http://localhost:3000', image)
    started = time.monotonic()
    while time.monotonic() - started < 180:
        data = json.loads(docker('inspect', name))[0]
        if not data['State']['Running']:
            raise RuntimeError('Backend stopped before readiness')
        if data['State'].get('Health', {}).get('Status') == 'healthy':
            break
        time.sleep(2)
    else:
        raise RuntimeError('Backend readiness exceeded 180 seconds')
    actual = json.loads(docker('image', 'inspect', data['Image']))[0]
    if actual['Config']['Labels']['ydb.revision'] != PINS['images'][image_name]['revision']:
        raise RuntimeError('Backend revision mismatch')
    if image not in actual['RepoDigests']:
        raise RuntimeError('Backend digest mismatch')
    save(out / 'backend.json', {'container': name, 'image_id': data['Image'], 'image': image,
                              'revision': actual['Config']['Labels']['ydb.revision'],
                              'readiness_seconds': round(time.monotonic() - started, 3),
                              'ports': data['NetworkSettings']['Ports'], 'cpuset': data['HostConfig']['CpusetCpus'], 'memory': data['HostConfig']['Memory']})
    return name, data['NetworkSettings']['Networks'][network]['IPAddress']


def runner(ui, out, network, ip, args, mode='test'):
    artifact_dir = out / 'output' / 'playwright-artifacts'
    artifact_dir.mkdir(parents=True, exist_ok=True)
    (artifact_dir / 'source-sha256.txt').write_text(source_manifest(ui))
    container = PREFIX + '-' + out.name + '-' + mode
    RESOURCES['containers'].add(container)
    env = {**os.environ,
           'PATH': str(ROOT / 'bin') + ':' + os.environ['PATH'],
           'CI': 'true', 'PLAYWRIGHT_APP_BACKEND': 'http://localhost:8765',
           'PLAYWRIGHT_RELEASE_REF': PINS[ui + '_sha'], 'PLAYWRIGHT_RELEASE_VERSION': '1.58.0',
           'PLAYWRIGHT_RELEASE_MODE': mode, 'PLAYWRIGHT_RELEASE_OUTPUT': str(out / 'output'),
           'PLAYWRIGHT_PLATFORM': 'linux/amd64', 'PLAYWRIGHT_VIDEO': 'retain-on-failure',
           'COMPARE_CONTAINER': container, 'COMPARE_NETWORK': network,
           'COMPARE_BACKEND_IP': ip, 'COMPARE_OUTPUT': str(out),
           'COMPARE_LABEL': PREFIX,
           'COMPARE_PREFLIGHT': '1' if out.parent.name == 'inventory' else '0'}
    for key in ['PLAYWRIGHT_BASE_URL', 'PWTEST_SHARD_WEIGHTS', 'PLAYWRIGHT_RELEASE_TEST_REF',
                'PLAYWRIGHT_SHOW_REPORT']:
        env.pop(key, None)
    command = ['/bin/bash', str(CONTROLLER / 'scripts/playwright-docker.sh'), *args]
    save(out / (mode + '-command.json'), {'args': command,
        'env': {key: value for key, value in env.items() if key.startswith(('PLAYWRIGHT_', 'COMPARE_')) or key == 'CI'}})
    return run(command, out / (mode + '.log'), env=env, cwd=CONTROLLER)


def flatten(report):
    cases = []
    def walk(suite, parents):
        titles = parents + ([suite['title']] if suite.get('title') else [])
        for spec in suite.get('specs', []):
            for test in spec.get('tests', []):
                key = '|'.join([spec['file'], *titles, spec['title'], test['projectName']])
                cases.append({'id': spec['id'], 'key': key, 'file': spec['file'], 'title': spec['title'],
                              'browser': test['projectName'], 'status': test.get('status'),
                              'results': test.get('results', [])})
        for child in suite.get('suites', []):
            walk(child, titles)
    for suite in report.get('suites', []):
        walk(suite, [])
    return cases


def validate_report(out, inventory_name):
    artifact = out / 'output' / 'playwright-artifacts'
    if hashlib.sha256((artifact / 'source-sha256.txt').read_bytes()).hexdigest() != PINS['source_manifest_sha256']:
        raise RuntimeError('Source checksum manifest changed')
    report = json.loads((artifact / 'test-results.json').read_text())
    cases = flatten(report)
    if sorted(c['key'] for c in cases) != STATE['inventories'][inventory_name]['keys']:
        raise RuntimeError('Report inventory mismatch')
    if report.get('errors'):
        raise RuntimeError('Outside-test errors in report')
    if any(attempt['retry'] != 0 for case in cases for attempt in case['results']):
        raise RuntimeError('Unexpected retry')
    html_root = artifact / 'playwright-report'
    encoded = re.search(r'data:application/zip;base64,([A-Za-z0-9+/=]+)',
                        (html_root / 'index.html').read_text())
    if not encoded:
        raise RuntimeError('HTML report payload missing')
    archive = zipfile.ZipFile(io.BytesIO(base64.b64decode(encoded[1])))
    html = json.loads(archive.read('report.json'))
    for outcome in ['expected', 'unexpected', 'flaky', 'skipped']:
        if html['stats'][outcome] != report['stats'][outcome]:
            raise RuntimeError('HTML/JSON counts differ: ' + outcome)
    html_tests = [test for name in archive.namelist() if name != 'report.json' and name.endswith('.json')
                  for test in json.loads(archive.read(name)).get('tests', [])]
    html_keys = ['|'.join([t['location']['file'], *t['path'], t['title'], t['projectName']]) for t in html_tests]
    json_keys = [c['key'].removeprefix(c['file'] + '|') for c in cases]
    if sorted(html_keys) != sorted(json_keys):
        raise RuntimeError('HTML/JSON test identities differ')
    attachments = 0
    for test in html_tests:
        for result in test['results']:
            for attachment in result.get('attachments', []):
                if attachment.get('path'):
                    file = (html_root / attachment['path']).resolve()
                    if not file.is_relative_to(html_root.resolve()) or not file.is_file() or not file.stat().st_size:
                        raise RuntimeError('Missing HTML attachment: ' + attachment['path'])
                    attachments += 1
    save(out / 'cases.json', cases)
    save(out / 'html-cases.json', html_tests)
    return {'counts': report['stats'], 'cases': len(cases), 'attachments': attachments}


def inventory(ui, args, label):
    out = ROOT / 'inventory' / label
    out.mkdir(parents=True)
    network = PREFIX + '-inventory'
    create_network(network)
    try:
        _, ip = backend('26.2.1.14', 'preflight', network, out)
        result = runner(ui, out, network, ip, [*args, '--list', '--reporter=json'])
        if result['exit_code']:
            raise RuntimeError('Inventory runner failed: ' + label)
        text = (out / 'test.log').read_text()
        start = re.search(r'\{\s*"config"\s*:', text)
        if not start:
            raise RuntimeError('JSON inventory missing: ' + label)
        report, _ = json.JSONDecoder().raw_decode(text[start.start():])
        cases = flatten(report)
        save(out / 'cases.json', cases)
        if not cases or len({c['key'] for c in cases}) != len(cases):
            raise RuntimeError('Empty or duplicate inventory: ' + label)
        if len(cases) != 114 or {c['browser'] for c in cases} != {'safari'}:
            raise RuntimeError('Expected the original 114-case Safari shard6')
        if not any(c['title'] == 'Storage usage table renders expanded state' for c in cases):
            raise RuntimeError('Storage scenario missing from inventory')
        STATE['inventories'][label] = {'count': len(cases), 'keys': sorted(c['key'] for c in cases)}
        return cases
    finally:
        remove_resources()
        subprocess.run(['node', str(CONTROLLER / '.github/workflows/scripts/release-e2e-report.js'), 'sanitize', str(out / 'output')], check=True)


def monitor(stop, out):
    with (out / 'docker-stats.jsonl').open('w') as f:
        while not stop.is_set():
            try:
                names = docker('ps', '--filter', 'label=' + LABEL, '--format', '{{.Names}}').splitlines()
                if names:
                    stats = docker('stats', '--no-stream', '--format', '{{json .}}', *names)
                    for line in stats.splitlines():
                        f.write(json.dumps({'at': now(), 'stats': json.loads(line)}) + '\n')
                    f.flush()
            except Exception as error:
                f.write(json.dumps({'at': now(), 'measurement_error': str(error)}) + '\n')
            stop.wait(5)


def trial(group, ui, image_name, arm, index, args, inventory_name):
    trial_id = f'{group}-{index}-{arm.lower()}'
    out = ROOT / 'trials' / trial_id
    out.mkdir(parents=True)
    result = {'id': trial_id, 'group': group, 'arm': arm, 'ui_sha': PINS[ui + '_sha'],
              'backend': image_name, 'started': now(), 'state': 'preparing'}
    STATE['trials'].append(result)
    status(trial_id + ':prepare')
    network = PREFIX + '-' + trial_id
    create_network(network)
    stop = threading.Event()
    sampler = None
    backend_name = None
    try:
        backend_name, ip = backend(image_name, trial_id, network, out)
        sampler = threading.Thread(target=monitor, args=(stop, out))
        sampler.start()
        status(trial_id + ':test')
        result['test'] = runner(ui, out, network, ip,
            [*args, '--workers=2', '--retries=0', '--update-snapshots=none', '--forbid-only'])
        if result['test']['exit_code'] not in [0, 1]:
            raise RuntimeError('Unexpected runner/source verification exit code')
        stop.set()
        sampler.join(timeout=40)
        if sampler.is_alive():
            raise RuntimeError('Metrics sampler did not stop')
        blobs = list((out / 'output' / 'blob-report').glob('*.zip'))
        if len(blobs) != 1:
            raise RuntimeError('Expected one original blob per trial')
        target = out / 'output' / 'all-blob-reports'
        target.mkdir()
        before = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in blobs}
        for blob in blobs:
            shutil.copyfile(blob, target / blob.name)
        status(trial_id + ':report')
        result['merge'] = runner(ui, out, network, ip, [], mode='report')
        if result['merge']['exit_code']:
            raise RuntimeError('Report merge failed')
        if before != {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in blobs}:
            raise RuntimeError('Original blobs changed')
        if any(p.is_dir() for p in target.iterdir()):
            raise RuntimeError('Report merge unpacked data into read-only input directory')
        result.update(state='complete', **validate_report(out, inventory_name),
                      blob_sha256=before, finished=now())
    except BaseException:
        result.update(state='incomplete', error=traceback.format_exc(), finished=now())
        raise
    finally:
        stop.set()
        if sampler:
            sampler.join(timeout=40)
        if backend_name:
            p = subprocess.run([*DOCKER, 'logs', backend_name], capture_output=True, text=True)
            (out / 'backend.log').write_text(p.stdout + p.stderr)
        try:
            remove_resources()
            shutil.copyfile(ROOT / 'cleanup.json', out / 'cleanup.json')
            subprocess.run(['node', str(CONTROLLER / '.github/workflows/scripts/release-e2e-report.js'), 'sanitize', str(out / 'output')], check=True)
        except BaseException:
            result.update(state='incomplete', finalization_error=traceback.format_exc())
            raise
        finally:
            save(out / 'result.json', result)
            status(trial_id + ':' + result['state'])


def prepare():
    if (ROOT / 'status.json').exists():
        raise RuntimeError('This run already exists; automatic retry is forbidden')
    if os.cpu_count() < 4:
        raise RuntimeError('The comparison requires at least four CPUs')
    for name, digest in PINS['controller_files'].items():
        if hashlib.sha256((CONTROLLER / name).read_bytes()).hexdigest() != digest:
            raise RuntimeError('Pinned controller file differs: ' + name)
    environment = {
        'at': now(), 'machine': os.uname().machine, 'frontend_mode': 'npm-start',
        'cpu_count': os.cpu_count(), 'memory': Path('/proc/meminfo').read_text(),
        'workflow_sha': os.environ['GITHUB_WORKFLOW_SHA'],
        'run_id': os.environ['GITHUB_RUN_ID'],
        'run_attempt': os.environ['GITHUB_RUN_ATTEMPT'],
        'controller_sha': PINS['controller_sha'], 'pins': PINS,
        'docker_version': docker('version', '--format', '{{.Server.Version}}'),
    }
    save(ROOT / 'provenance.json', environment)
    archive_path = ROOT / 'ui-source.tar.gz'
    fetched = run(['curl', '--fail', '--location', '--retry', '2', '--max-time', '120',
                  'https://codeload.github.com/ydb-platform/ydb-embedded-ui/tar.gz/' + PINS['ui15_sha'],
                  '--output', str(archive_path)], ROOT / 'download-source.log')
    if fetched['exit_code']:
        raise RuntimeError('Could not download pinned UI source')
    lines = []
    with tarfile.open(archive_path) as archive:
        for member in archive.getmembers():
            prefix, _, name = member.name.partition('/')
            if prefix != 'ydb-embedded-ui-' + PINS['ui15_sha']:
                raise RuntimeError('Unexpected source archive root')
            if member.isfile():
                lines.append(hashlib.sha256(archive.extractfile(member).read()).hexdigest() + '  ' + name + '\n')
    manifest = ''.join(sorted(lines))
    if len(lines) != PINS['source_files'] or hashlib.sha256(manifest.encode()).hexdigest() != PINS['source_manifest_sha256']:
        raise RuntimeError('Pinned source differs from the native comparison')
    (ROOT / 'source-sha256.txt').write_text(manifest)
    shutil.copyfile(CODE / 'pins.json', ROOT / 'pins.json')
    for image in [PINS['playwright'], 'ghcr.io/ydb-platform/local-ydb@' + PINS['images']['26.2.1.14']['digest']]:
        result = run([*DOCKER, 'pull', '--platform', 'linux/amd64', image], ROOT / ('pull-' + image.split('@')[1][7:19] + '.log'))
        if result['exit_code']:
            raise RuntimeError('Pinned image pull failed')
        inspected = json.loads(docker('image', 'inspect', image))[0]
        if inspected['Architecture'] != 'amd64' or image not in inspected['RepoDigests']:
            raise RuntimeError('Pinned image identity mismatch')
    (ROOT / 'bin').mkdir()
    (ROOT / 'bin/docker').symlink_to(CODE / 'docker-wrapper.py')
    STATE['started'] = now()
    status('inventory')
    inventory('ui15', ['--shard=6/8'], 'shard6')
    status('prepared')


def summarize():
    complete = (len(STATE['trials']) == 6
                and all(t['state'] == 'complete' for t in STATE['trials'])
                and not STATE.get('error') and not STATE.get('cleanup_error')
                and os.environ.get('UPLOAD_RESULTS', '').split() == ['success'] * 6)
    totals = {key: sum(t.get('counts', {}).get(key, 0) for t in STATE['trials'])
              for key in ['expected', 'unexpected', 'skipped', 'flaky']}
    if not complete:
        conclusion = 'incomplete'
    elif totals['unexpected']:
        conclusion = 'failed'
    else:
        conclusion = 'passed'
    rows = ['# Release E2E memory comparison', '', 'Conclusion: **' + conclusion + '**', '',
            '| Trial | Passed | Failed | Skipped | Playwright seconds |', '|---|---:|---:|---:|---:|']
    for t in STATE['trials']:
        c = t.get('counts', {})
        rows.append('| %s | %s | %s | %s | %s |' % (t['id'], c.get('expected', '-'), c.get('unexpected', '-'), c.get('skipped', '-'), round(c.get('duration', 0) / 1000, 2)))
    rows += ['', 'UI: ' + PINS['ui15_sha'], 'Controller: ' + PINS['controller_sha'],
             'Frontend: npm-start; backend26.2.1.14; shard6/8; workers2; retries0.']
    summary = '\n'.join(rows) + '\n'
    (ROOT / 'summary.md').write_text(summary)
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as out:
        out.write(summary)
    save(ROOT / 'summary.json', {'series_complete': complete, 'conclusion': conclusion, 'totals': totals})
    status('complete' if complete else 'incomplete')
    return 0 if conclusion == 'passed' else 1


def main():
    global STATE
    ROOT.mkdir(parents=True, exist_ok=True)
    command, *args = sys.argv[1:]
    if (ROOT / 'status.json').exists():
        STATE = json.loads((ROOT / 'status.json').read_text())
    if command == 'prepare' and not args:
        prepare()
    elif command == 'trial' and len(args) == 1:
        index = int(args[0])
        if index not in range(1, 7) or len(STATE['trials']) != index - 1:
            raise RuntimeError('Refusing repeated or out-of-order trial')
        expected_phase = 'prepared' if index == 1 else f'github-shard6-{index-1}-{ORDER[index-2].lower()}:complete'
        if STATE['phase'] != expected_phase:
            raise RuntimeError('Previous preparation or trial is incomplete')
        arm = ORDER[index-1]
        trace = 'retain-on-failure' if arm == 'A' else 'off'
        trial('github-shard6', 'ui15', '26.2.1.14', arm, index,
              ['--shard=6/8', '--trace=' + trace], 'shard6')
    elif command == 'cleanup' and not args:
        remove_resources()
    elif command == 'summarize' and not args:
        return summarize()
    else:
        raise RuntimeError('Unknown diagnostic command')
    return 0


def interrupted(signum, frame):
    raise InterruptedError('Comparison interrupted: ' + str(signum))


if __name__ == '__main__':
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    try:
        exit_code = main()
    except BaseException:
        ROOT.mkdir(parents=True, exist_ok=True)
        STATE['error'] = traceback.format_exc()
        status('blocked')
        try:
            remove_resources()
        except Exception:
            STATE['cleanup_error'] = traceback.format_exc()
            status('cleanup-failed')
        raise
    sys.exit(exit_code)
