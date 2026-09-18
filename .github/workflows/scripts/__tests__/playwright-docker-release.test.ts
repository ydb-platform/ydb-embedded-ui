import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(__dirname, '../../../..');
const runner = path.join(root, 'scripts/playwright-docker.sh');

describe('release Playwright container boundary', () => {
    let directory: string;
    let env: NodeJS.ProcessEnv;

    beforeEach(() => {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-runner-test-'));
        fs.writeFileSync(
            path.join(directory, 'docker'),
            `#!/usr/bin/env node\nrequire('fs').writeFileSync(process.env.CAPTURE, JSON.stringify(process.argv.slice(2)));\n`,
            {mode: 0o755},
        );
        env = {
            ...process.env,
            PATH: `${directory}:${process.env.PATH}`,
            CAPTURE: path.join(directory, 'arguments.json'),
            PLAYWRIGHT_RELEASE_REF: 'a'.repeat(40),
            PLAYWRIGHT_RELEASE_VERSION: '1.58.0',
            PLAYWRIGHT_RELEASE_MODE: 'test',
            PLAYWRIGHT_RELEASE_OUTPUT: path.join(directory, 'output'),
            PLAYWRIGHT_APP_BACKEND: 'http://localhost:8765',
            PLAYWRIGHT_BASE_URL: 'http://localhost:8765/monitoring/',
            GITHUB_TOKEN: 'must-not-enter-container',
            ACTIONS_RUNTIME_TOKEN: 'must-not-enter-container',
        };
    });
    afterEach(() => {
        fs.rmSync(directory, {recursive: true, force: true});
    });

    test.each([
        ['test', 'http://localhost:8765'],
        ['report', ''],
        ['local', 'https://localhost:8765'],
    ])('sets safe mounts and credentials in %s mode', (mode, backend) => {
        execFileSync('bash', [runner, '--shard=1/8'], {
            cwd: root,
            env: {
                ...env,
                PLAYWRIGHT_RELEASE_REF: mode === 'local' ? '' : env.PLAYWRIGHT_RELEASE_REF,
                PLAYWRIGHT_RELEASE_MODE: mode,
                PLAYWRIGHT_APP_BACKEND: backend,
            },
        });
        const args: string[] = JSON.parse(
            fs.readFileSync(path.join(directory, 'arguments.json'), 'utf8'),
        );
        const mounts = args.filter((_, index) => args[index - 1] === '-v');
        const output = path.join(directory, 'output');
        if (mode === 'local') {
            expect(mounts).toEqual([
                `${root}:/work`,
                'ydb-embedded-ui-node-modules:/work/node_modules',
            ]);
            expect(args).toContain('PLAYWRIGHT_APP_BACKEND=https://localhost:8765');
        } else {
            expect(mounts).toContain(`${output}/blob-report:/work/blob-report`);
            expect(mounts).toContain(`${output}/playwright-artifacts:/work/playwright-artifacts`);
            expect(mounts).not.toContain(`${root}:/work`);
            expect(args).toContain(`PLAYWRIGHT_RELEASE_REF=${'a'.repeat(40)}`);
        }
        expect(mounts.some((mount) => mount.includes('docker.sock'))).toBe(false);
        expect(args.some((arg) => arg.includes('must-not-enter-container'))).toBe(false);
        expect(args).toContain('mcr.microsoft.com/playwright:v1.58.0-noble');
        if (mode === 'report') {
            expect(mounts).toContain(`${output}/all-blob-reports:/work/all-blob-reports:ro`);
        }
    });

    test('rejects an unpinned release ref before starting Docker', () => {
        expect(() =>
            execFileSync('bash', [runner], {
                cwd: root,
                env: {...env, PLAYWRIGHT_RELEASE_REF: 'main', PLAYWRIGHT_APP_BACKEND: ''},
                stdio: 'pipe',
            }),
        ).toThrow('release mode requires a commit SHA');
    });

    test.each(['PLAYWRIGHT_APP_BACKEND', 'PLAYWRIGHT_BASE_URL'])(
        'rejects HTTPS in %s before starting release Docker',
        (variable) => {
            const result = spawnSync('bash', [runner], {
                cwd: root,
                encoding: 'utf8',
                env: {...env, [variable]: 'https://localhost:8765/monitoring/'},
            });
            expect(result.error).toBeUndefined();
            expect(result.status).toBe(1);
            expect(result.stderr).toContain(`${variable} must use HTTP in release mode`);
            expect(fs.existsSync(path.join(directory, 'arguments.json'))).toBe(false);
        },
    );
});
