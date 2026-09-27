#!/usr/bin/env python3
"""Pin the image and connect the unchanged runner to a task-only Docker network."""
import json
import os
from pathlib import Path
import sys

root = Path(__file__).resolve().parent
pins = json.loads((root / 'pins.json').read_text())
args = sys.argv[1:]
if args and args[0] == 'run':
    for index, arg in enumerate(args):
        if arg == 'mcr.microsoft.com/playwright:v1.58.0-noble':
            args[index] = pins['playwright']
        elif arg == 'host.docker.internal:host-gateway':
            args[index] = 'host.docker.internal:' + os.environ['COMPARE_BACKEND_IP']
    name = os.environ['COMPARE_CONTAINER']
    args[1:1] = ['--name', name, '--label', 'codex.task=' + os.environ['COMPARE_LABEL'],
                 '--network', os.environ['COMPARE_NETWORK'],
                 '--cpuset-cpus', '0-3', '--memory', '8g', '--memory-swap', '8g']
    command_at = args.index('-c') + 1
    command = args[command_at]
    # Verify tracked inputs after execution, outside the measured test command.
    verify = '''
verify_source() {
  result=$?
  trap - EXIT
  if ! sha256sum -c /work/playwright-artifacts/source-sha256.txt > /work/playwright-artifacts/source-check.log 2>&1; then
    echo 'Tracked source or lockfile changed' >&2
    exit 42
  fi
  exit "$result"
}
trap verify_source EXIT
'''
    args[command_at] = command.replace('echo "Running npm ci"', verify + '\necho "Running npm ci"')
    if os.environ['COMPARE_PREFLIGHT'] == '1':
        probe = (root / 'browser-preflight.cjs').read_text()
        args[command_at] = args[command_at].replace('echo "Running Playwright tests"',
            "node <<'PREFLIGHT'\n" + probe + "\nPREFLIGHT\necho \"Running Playwright tests\"")
    out = Path(os.environ['COMPARE_OUTPUT'])
    with (out / 'docker-commands.jsonl').open('a') as f:
        f.write(json.dumps(args) + '\n')
os.execv('/usr/bin/docker', ['docker', *args])
