#!/usr/bin/env python3
"""Temporary comparison: only the browser container's memory flag varies."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import os
import shutil
import signal
import subprocess
import sys
import tarfile
import threading
import time
import traceback

CODE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('compare', CODE / 'compare.py')
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
ROOT = c.ROOT
PREFIX = c.PREFIX
ORDER = ['uncapped', '8g', '8g', 'uncapped', 'uncapped', '8g']


def prepare():
    if (ROOT / 'status.json').exists():
        raise RuntimeError('An experiment already exists; refusing a duplicate launch')
    ROOT.mkdir(parents=True, exist_ok=True)
    for name, digest in c.PINS['controller_files'].items():
        if hashlib.sha256((c.CONTROLLER / name).read_bytes()).hexdigest() != digest:
            raise RuntimeError('Pinned controller changed: ' + name)
    c.save(ROOT / 'provenance.json', {
        'at': c.now(), 'workflow_sha': os.environ['GITHUB_WORKFLOW_SHA'],
        'run_id': os.environ['GITHUB_RUN_ID'], 'run_attempt': os.environ['GITHUB_RUN_ATTEMPT'],
        'cpu_count': os.cpu_count(), 'architecture': os.uname().machine,
        'cpu_models': sorted({line.split(':', 1)[1].strip() for line in Path('/proc/cpuinfo').read_text().splitlines() if line.startswith('model name')}),
        'host_memory': Path('/proc/meminfo').read_text(), 'pins': c.PINS,
        'docker_version': c.docker('version', '--format', '{{.Server.Version}}'),
        'factor': 'Playwright Docker --memory=8g versus no memory option',
        'order': ORDER, 'preflight': 'No browser/frontend warmup outside original Playwright globalSetup',
    })
    result = c.run(['curl', '--fail', '--location', '--max-time', '120',
        'https://codeload.github.com/ydb-platform/ydb-embedded-ui/tar.gz/' + c.PINS['ui15_sha'],
        '--output', str(ROOT / 'ui-source.tar.gz')], ROOT / 'download-source.log')
    if result['exit_code']:
        raise RuntimeError('Pinned source download failed')
    lines = []
    with tarfile.open(ROOT / 'ui-source.tar.gz') as archive:
        for member in archive:
            prefix, _, name = member.name.partition('/')
            if prefix != 'ydb-embedded-ui-' + c.PINS['ui15_sha']:
                raise RuntimeError('Unexpected source archive')
            if member.isfile():
                lines.append(hashlib.sha256(archive.extractfile(member).read()).hexdigest() + '  ' + name + '\n')
    manifest = ''.join(sorted(lines))
    if len(lines) != c.PINS['source_files'] or hashlib.sha256(manifest.encode()).hexdigest() != c.PINS['source_manifest_sha256']:
        raise RuntimeError('Historical sources differ from the verified baseline')
    (ROOT / 'source-sha256.txt').write_text(manifest)
    shutil.copyfile(CODE / 'pins.json', ROOT / 'pins.json')
    result = c.run([*c.DOCKER, 'pull', c.PINS['playwright']], ROOT / 'pull-playwright.log')
    if result['exit_code']:
        raise RuntimeError('Pinned Playwright image pull failed')
    (ROOT / 'bin').mkdir()
    (ROOT / 'bin/docker').symlink_to(CODE / 'memory-docker.py')
    c.STATE = {'started': c.now(), 'phase': 'prepared', 'trials': [],
               'inventories': {'shard6': json.loads((CODE / 'shard6-inventory.json').read_text())}}
    c.status('prepared')


def backend_name(index):
    return f'memory-ui-{os.environ["GITHUB_RUN_ID"]}-{os.environ["GITHUB_RUN_ATTEMPT"]}-{index}'


def cleanup(index, out):
    base = backend_name(index)
    resources = [('container', base + '-static'), ('network', base + '-net'), ('volume', base + '-data')]
    trial_id = f'memory-shard6-{index}'
    resources[:0] = [('container', PREFIX + '-' + trial_id + '-' + mode) for mode in ['test', 'report']]
    rows = []
    for kind, name in resources:
        listed = c.docker(*(['ps', '-a'] if kind == 'container' else [kind, 'ls']), '--format', '{{.Names}}' if kind == 'container' else '{{.Name}}').splitlines()
        existed = name in listed
        if existed:
            if kind == 'container':
                info = json.loads(c.docker('inspect', name))[0]
                if name.startswith(PREFIX) and info['Config'].get('Labels', {}).get('codex.task') != PREFIX:
                    raise RuntimeError('Unexpected ownership for ' + name)
            c.docker(*(['rm', '-f', '-v', name] if kind == 'container' else [kind, 'rm', name]))
        listed = c.docker(*(['ps', '-a'] if kind == 'container' else [kind, 'ls']), '--format', '{{.Names}}' if kind == 'container' else '{{.Name}}').splitlines()
        rows.append({'resource': kind, 'name': name, 'status': 'failed' if name in listed else 'removed' if existed else 'absent'})
    c.save(out / 'cleanup.json', {'at': c.now(), 'resources': rows})
    if any(r['status'] == 'failed' for r in rows):
        raise RuntimeError('Experiment resource survived cleanup')


def sample(stop, out, backend):
    test_container = PREFIX + '-' + out.name + '-test'
    captured = False
    with (out / 'docker-stats.jsonl').open('w') as log:
        while not stop.is_set():
            try:
                running = c.docker('ps', '--format', '{{.Names}}').splitlines()
                names = [name for name in [backend, test_container] if name in running]
                if test_container in names and not captured:
                    info = json.loads(c.docker('inspect', test_container))[0]
                    c.save(out / 'browser-container.json', {
                        'image_id': info['Image'], 'image': info['Config']['Image'],
                        'host_config': {key: info['HostConfig'].get(key) for key in ['Memory','MemorySwap','NanoCpus','CpuQuota','CpuPeriod','CpusetCpus','ShmSize','NetworkMode']},
                    })
                    captured = True
                if names:
                    for line in c.docker('stats', '--no-stream', '--format', '{{json .}}', *names).splitlines():
                        log.write(json.dumps({'at': c.now(), 'stats': json.loads(line)}) + '\n')
                    log.flush()
            except Exception as error:
                log.write(json.dumps({'at': c.now(), 'measurement_error': str(error)}) + '\n')
                log.flush()
            stop.wait(5)


def trial(index):
    if index not in range(1, 7) or len(c.STATE['trials']) != index - 1:
        raise RuntimeError('Refusing repeated or out-of-order trial')
    expected = 'prepared' if index == 1 else f'memory-shard6-{index-1}:complete'
    if c.STATE['phase'] != expected:
        raise RuntimeError('Previous setup/report is incomplete')
    out = ROOT / 'trials' / f'memory-shard6-{index}'
    out.mkdir(parents=True)
    memory = ORDER[index-1]
    result = {'id': out.name, 'arm': 'A' if memory == 'uncapped' else 'B', 'memory': memory,
              'started': c.now(), 'state': 'preparing'}
    c.STATE['trials'].append(result)
    c.status(out.name + ':prepare')
    backend = backend_name(index) + '-static'
    stop = threading.Event()
    sampler = None
    try:
        info = json.loads(c.docker('inspect', backend))[0]
        image = json.loads(c.docker('image', 'inspect', info['Image']))[0]
        expected_image = 'ghcr.io/ydb-platform/local-ydb@' + c.PINS['images']['26.2.1.14']['digest']
        if expected_image not in image['RepoDigests'] or image['Config']['Labels']['ydb.revision'] != c.PINS['images']['26.2.1.14']['revision']:
            raise RuntimeError('Backend image/revision changed')
        c.save(out / 'backend.json', {
            'name': backend, 'image_id': info['Image'], 'image': expected_image,
            'revision': image['Config']['Labels']['ydb.revision'],
            'env': [v for v in info['Config']['Env'] if v.split('=', 1)[0] in ['YDB_ALLOW_ORIGIN','YDB_GRPC_ENABLE_TLS','YDB_ANONYMOUS_CREDENTIALS','YDB_LOCAL_SURVIVE_RESTART','YDB_FEATURE_FLAGS','MON_PORT','GRPC_PORT','GRPC_TLS_PORT']],
            'hostname': info['Config']['Hostname'], 'healthcheck': info['Config'].get('Healthcheck'),
            'host_config': {key: info['HostConfig'].get(key) for key in ['Memory','MemorySwap','NanoCpus','CpuQuota','CpuPeriod','CpusetCpus','NetworkMode','PortBindings']},
            'mounts': info['Mounts'],
        })
        sampler = threading.Thread(target=sample, args=(stop, out, backend))
        sampler.start()
        os.environ['COMPARE_MEMORY'] = memory
        c.status(out.name + ':test')
        result['test'] = c.runner('ui15', out, '', '', ['--shard=6/8', '--workers=2', '--retries=0',
            '--trace=retain-on-failure', '--update-snapshots=none', '--forbid-only'])
        stop.set()
        sampler.join(timeout=40)
        if sampler.is_alive():
            raise RuntimeError('Metrics sampler did not finish')
        if result['test']['exit_code'] not in [0, 1]:
            raise RuntimeError('Preparation/source validation failed')
        browser = json.loads((out / 'browser-container.json').read_text())
        target_memory = 8 * 1024**3 if memory == '8g' else 0
        if browser['host_config']['Memory'] != target_memory or browser['host_config']['CpusetCpus']:
            raise RuntimeError('Unexpected browser resource configuration')
        blobs = list((out / 'output/blob-report').glob('*.zip'))
        if len(blobs) != 1:
            raise RuntimeError('Expected one complete blob report')
        hashes = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in blobs}
        target = out / 'output/all-blob-reports'
        target.mkdir()
        for blob in blobs:
            shutil.copyfile(blob, target / blob.name)
        c.status(out.name + ':report')
        result['merge'] = c.runner('ui15', out, '', '', [], mode='report')
        if result['merge']['exit_code']:
            raise RuntimeError('Report merge failed')
        if hashes != {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in blobs}:
            raise RuntimeError('Original blobs changed')
        verified = c.validate_report(out, 'shard6')
        cases = json.loads((out / 'cases.json').read_text())
        if any(len(test['results']) != 1 for test in cases):
            raise RuntimeError('Missing or repeated test attempts')
        skipped = sorted(test['key'] for test in cases if test['status'] == 'skipped')
        if skipped != c.STATE['inventories']['shard6']['skipped_keys']:
            raise RuntimeError('Original skipped cases changed')
        result.update(state='complete', **verified, blob_sha256=hashes, finished=c.now())
    except BaseException:
        result.update(state='incomplete', error=traceback.format_exc(), finished=c.now())
        raise
    finally:
        stop.set()
        if sampler:
            sampler.join(timeout=40)
        log = subprocess.run([*c.DOCKER, 'logs', backend], capture_output=True, text=True, timeout=30)
        (out / 'backend.log').write_text(log.stdout + log.stderr)
        try:
            cleanup(index, out)
            subprocess.run(['node', str(c.CONTROLLER / '.github/workflows/scripts/release-e2e-report.js'), 'sanitize', str(out / 'output')], check=True)
        except BaseException:
            result.update(state='incomplete', finalization_error=traceback.format_exc())
            raise
        finally:
            c.save(out / 'result.json', result)
            c.status(out.name + ':' + result['state'])


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    if (ROOT / 'status.json').exists():
        c.STATE = json.loads((ROOT / 'status.json').read_text())
    command, *args = sys.argv[1:]
    if command == 'prepare' and not args:
        prepare()
    elif command == 'trial' and len(args) == 1:
        trial(int(args[0]))
    elif command == 'cleanup' and not args:
        for i in range(1, 7):
            out = ROOT / 'cleanup' / str(i)
            out.mkdir(parents=True, exist_ok=True)
            cleanup(i, out)
    elif command == 'summarize' and not args:
        return c.summarize()
    else:
        raise RuntimeError('Invalid command')
    return 0


if __name__ == '__main__':
    signal.signal(signal.SIGTERM, c.interrupted)
    signal.signal(signal.SIGINT, c.interrupted)
    try:
        exit_code = main()
    except BaseException:
        c.STATE['error'] = traceback.format_exc()
        c.status('blocked')
        raise
    sys.exit(exit_code)
