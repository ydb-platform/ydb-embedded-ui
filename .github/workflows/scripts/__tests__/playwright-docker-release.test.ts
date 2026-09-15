import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(__dirname, '../../../..');
const runner = path.join(root, 'scripts/playwright-docker.sh');

describe('release Playwright container boundary', () => {
    test.each(['test', 'report', 'local'])(
        'sets safe mounts and credentials in %s mode',
        (mode) => {
            const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-runner-test-'));
            try {
                const capture = path.join(directory, 'arguments.json');
                const output = path.join(directory, 'output');
                const docker = path.join(directory, 'docker');
                fs.writeFileSync(
                    docker,
                    `#!/usr/bin/env node\nrequire('fs').writeFileSync(process.env.CAPTURE, JSON.stringify(process.argv.slice(2)));\n`,
                    {mode: 0o755},
                );
                execFileSync('bash', [runner, '--shard=1/8'], {
                    cwd: root,
                    env: {
                        ...process.env,
                        PATH: `${directory}:${process.env.PATH}`,
                        CAPTURE: capture,
                        PLAYWRIGHT_RELEASE_REF: mode === 'local' ? '' : 'a'.repeat(40),
                        PLAYWRIGHT_RELEASE_VERSION: '1.58.0',
                        PLAYWRIGHT_RELEASE_MODE: mode,
                        PLAYWRIGHT_RELEASE_OUTPUT: output,
                        PLAYWRIGHT_APP_BACKEND: 'http://localhost:8765',
                        GITHUB_TOKEN: 'must-not-enter-container',
                        ACTIONS_RUNTIME_TOKEN: 'must-not-enter-container',
                    },
                });
                const args: string[] = JSON.parse(fs.readFileSync(capture, 'utf8'));
                const mounts = args.filter((_, index) => args[index - 1] === '-v');
                if (mode === 'local') {
                    expect(mounts).toEqual([
                        `${root}:/work`,
                        'ydb-embedded-ui-node-modules:/work/node_modules',
                    ]);
                } else {
                    expect(mounts).toContain(`${output}/blob-report:/work/blob-report`);
                    expect(mounts).toContain(
                        `${output}/playwright-artifacts:/work/playwright-artifacts`,
                    );
                    expect(mounts).not.toContain(`${root}:/work`);
                    expect(args).toContain(`PLAYWRIGHT_RELEASE_REF=${'a'.repeat(40)}`);
                }
                expect(mounts.some((mount) => mount.includes('docker.sock'))).toBe(false);
                expect(args.some((arg) => arg.includes('must-not-enter-container'))).toBe(false);
                expect(args).toContain('mcr.microsoft.com/playwright:v1.58.0-noble');
                if (mode === 'report') {
                    expect(mounts).toContain(
                        `${output}/all-blob-reports:/work/all-blob-reports:ro`,
                    );
                }
            } finally {
                fs.rmSync(directory, {recursive: true, force: true});
            }
        },
    );

    test('rejects an unpinned release ref before starting Docker', () => {
        expect(() =>
            execFileSync('bash', [runner], {
                cwd: root,
                env: {
                    ...process.env,
                    PLAYWRIGHT_RELEASE_REF: 'main',
                    PLAYWRIGHT_RELEASE_VERSION: '1.58.0',
                    PLAYWRIGHT_APP_BACKEND: '',
                },
                stdio: 'pipe',
            }),
        ).toThrow('release mode requires a commit SHA');
    });
});
