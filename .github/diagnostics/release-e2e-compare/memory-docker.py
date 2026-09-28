#!/usr/bin/env python3
"""Keep the stock runner command; vary only --memory for test containers."""
from pathlib import Path
import json
import os
import sys

CODE = Path(__file__).resolve().parent
pins = json.loads((CODE / 'pins.json').read_text())
args = sys.argv[1:]
if args and args[0] == 'run':
    mode = os.environ['PLAYWRIGHT_RELEASE_MODE']
    memory = os.environ['COMPARE_MEMORY']
    if mode not in ['test','report'] or memory not in ['uncapped','8g']:
        raise RuntimeError('Invalid experiment mode')
    args = [pins['playwright'] if arg == 'mcr.microsoft.com/playwright:v1.58.0-noble' else arg for arg in args]
    args[1:1] = ['--name', os.environ['COMPARE_CONTAINER'], '--label', 'codex.task=' + os.environ['COMPARE_LABEL']]
    if mode == 'test' and memory == '8g':
        args[1:1] = ['--memory', '8g']
    position = args.index('-c') + 1
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
    args[position] = args[position].replace('echo "Running npm ci"', verify + '\necho "Running npm ci"')
    observation = '''
node <<'RESOURCE_PROBE'
const fs = require('node:fs');
const os = require('node:os');
const v8 = require('node:v8');
const data = {at: new Date().toISOString(), node: process.version, cpuCount: os.cpus().length, availableParallelism: os.availableParallelism(), totalMemory: os.totalmem(), freeMemory: os.freemem(), constrainedMemory: process.constrainedMemory(), availableMemory: process.availableMemory(), heapLimit: v8.getHeapStatistics().heap_size_limit};
fs.writeFileSync('/work/playwright-artifacts/runtime-resources.json', JSON.stringify(data, null, 2));
RESOURCE_PROBE
'''
    args[position] = args[position].replace('echo "Running Playwright tests"', observation + '\necho "Running Playwright tests"')
    with (Path(os.environ['COMPARE_OUTPUT']) / 'docker-commands.jsonl').open('a') as log:
        log.write(json.dumps(args) + '\n')
os.execv('/usr/bin/docker', ['docker', *args])
