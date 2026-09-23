import {execFileSync, spawnSync} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs';
import http from 'node:http';
import type {AddressInfo, Server} from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';

import type {PlaywrightTestConfig} from '@playwright/test';

const root = path.resolve(__dirname, '../../../..');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/release-e2e.yml'), 'utf8');
const reportWorkflow = fs.readFileSync(
    path.join(root, '.github/workflows/release-e2e-report.yml'),
    'utf8',
);
const qualityWorkflow = fs.readFileSync(path.join(root, '.github/workflows/quality.yml'), 'utf8');

describe('release and pull-request E2E environment', () => {
    const releaseJob = workflow.split('\n  e2e:')[1].split('\n  report:')[0];
    const qualityJob = qualityWorkflow.split('\n  e2e_tests:')[1].split('\n  merge_reports:')[0];

    function setting(source: string, name: string) {
        const value = source.match(new RegExp(`^\\s+${name}: (.+)$`, 'm'))?.[1];
        if (!value) {
            throw new Error(`Missing E2E setting: ${name}`);
        }
        return value;
    }

    test('uses the same runner and Node version for release execution and reporting', () => {
        for (const name of ['runs-on', 'node-version']) {
            const value = setting(qualityJob, name);
            const matches = [
                ...`${workflow}\n${reportWorkflow}`.matchAll(new RegExp(`${name}: (.+)`, 'g')),
            ];
            expect(matches.length).toBeGreaterThan(0);
            expect(new Set(matches.map((match) => match[1]))).toEqual(new Set([value]));
        }
    });

    test('shares the verified setup action and root runtime settings', () => {
        const action = /uses: (astandrik\/setup-local-ydb@[a-f0-9]{40})/;
        expect(releaseJob.match(action)?.[1]).toBe(
            'astandrik/setup-local-ydb@ba59d49d74fdab2f308132e72da6d4e111b7200d',
        );
        expect(qualityJob.match(action)?.[1]).toBe(releaseJob.match(action)?.[1]);
        for (const name of ['topology', 'auth', 'cleanup']) {
            expect(setting(releaseJob, name)).toBe(setting(qualityJob, name));
        }
    });

    test('uses the action-selected backend endpoint in both workflows', () => {
        for (const job of [qualityJob, releaseJob]) {
            expect(job).toContain('id: ydb');
            expect(setting(job, 'PLAYWRIGHT_APP_BACKEND')).toBe(
                '${{ steps.ydb.outputs.monitoring-url }}',
            );
            expect(job).not.toContain('monitoring-port:');
        }
    });

    test('matches the current CI workers, retries, trace and video policy for historical tests', () => {
        const config: PlaywrightTestConfig = JSON.parse(
            execFileSync(
                process.execPath,
                [
                    '-e',
                    `const {default: config} = require('./playwright.config.ts');
console.log(JSON.stringify({workers: config.workers, retries: config.retries,
    use: {trace: config.use.trace, video: config.use.video}}));`,
                ],
                {
                    cwd: root,
                    env: {...process.env, CI: 'true', PLAYWRIGHT_VIDEO: ''},
                    encoding: 'utf8',
                    timeout: 10000,
                },
            ),
        );
        expect(releaseJob).toContain(`--workers=${config.workers}`);
        expect(releaseJob).toContain(`--retries=${config.retries}`);
        expect(releaseJob).toContain(`--trace=${config.use?.trace}`);
        expect(setting(releaseJob, 'PLAYWRIGHT_VIDEO')).toBe(config.use?.video);
    });
});

test.each(
    [workflow, reportWorkflow].flatMap((source) =>
        ['refs/heads/main', 'refs/heads/feature', 'refs/tags/v1.0.0'].map((ref) => ({source, ref})),
    ),
)('checks $ref before any controller checkout', ({source, ref}) => {
    const guard = source
        .split('\n  e2e:')[0]
        .match(/ {4}steps:\n {6}- name:.*\n(?: {8}id:.*\n)? {8}run: \|\n((?: {10}.*\n)+)/)?.[1];
    if (!guard) {
        throw new Error('Resolve must start with an inline guard before checkout');
    }
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-dispatch-'));
    try {
        const summary = path.join(directory, 'summary.md');
        const result = spawnSync('bash', ['-e', '-c', guard], {
            cwd: directory,
            env: {...process.env, GITHUB_REF: ref, GITHUB_STEP_SUMMARY: summary},
            encoding: 'utf8',
        });
        if (result.error) {
            throw result.error;
        }
        const error = path.join(directory, 'release-artifacts/setup-error.txt');
        if (ref === 'refs/heads/main') {
            expect(result.status).toBe(0);
            expect(fs.existsSync(error)).toBe(false);
        } else {
            expect(result.status).toBe(1);
            expect(fs.readFileSync(error, 'utf8')).toMatch(/main/);
            expect(fs.readFileSync(summary, 'utf8')).toContain(fs.readFileSync(error, 'utf8'));
        }
        expect(workflow.split('\n  report:')[1]).toContain(
            "    if: always() && github.ref == 'refs/heads/main'\n",
        );
    } finally {
        fs.rmSync(directory, {recursive: true, force: true});
    }
});

test('starts the release-version frontend while keeping local-ydb as its backend', () => {
    expect(workflow).not.toContain('PLAYWRIGHT_BASE_URL:');
    expect(workflow).toContain('PLAYWRIGHT_APP_BACKEND: ${{ steps.ydb.outputs.monitoring-url }}');
    expect(workflow).toContain('PLAYWRIGHT_RELEASE_REF: ${{ needs.resolve.outputs.ui_sha }}');
});

test('forwards backend routes and streaming without rewriting UI paths', async () => {
    const upstream = http.createServer((request, response) => {
        response.setHeader('Content-Type', 'text/plain');
        response.setHeader('x-method', request.method || '');
        response.setHeader('x-probe', request.headers['x-probe'] || '');
        response.writeHead(request.url === '/missing' ? 404 : 200);
        if (request.url === '/stream') {
            request.pipe(response);
        } else {
            response.end(request.url);
        }
    });
    upstream.listen(0, '127.0.0.1');
    await once(upstream, 'listening');
    let proxy: Server | undefined;
    try {
        const runner = fs.readFileSync(path.join(root, 'scripts/playwright-docker.sh'), 'utf8');
        const script = runner.split("node <<'NODE' &\n")[1].split('\nNODE')[0];
        // Execute the shipped proxy; only its bind port changes to avoid local services.
        proxy = runInNewContext(
            `${script.replace('server.listen(8765,', 'server.listen(0,')}\nserver`,
            {
                require,
                URL,
                console: {log: () => undefined},
                process: {
                    env: {
                        PLAYWRIGHT_RELEASE_REF: 'a'.repeat(40),
                        PLAYWRIGHT_RELEASE_MODE: 'test',
                        PLAYWRIGHT_PROXY_TARGET: `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`,
                    },
                },
            },
        ) as Server;
        await once(proxy, 'listening');
        const origin = `http://127.0.0.1:${(proxy.address() as AddressInfo).port}`;
        const request = (url: string, method = 'GET') =>
            new Promise<{
                status: number | undefined;
                headers: http.IncomingHttpHeaders;
                body: string;
            }>((resolve, reject) => {
                http.request(origin + url, {method, agent: false}, (response) => {
                    let body = '';
                    response.on('data', (chunk) => {
                        body += chunk;
                    });
                    response.on('end', () =>
                        resolve({status: response.statusCode, headers: response.headers, body}),
                    );
                    response.on('error', reject);
                })
                    .on('error', reject)
                    .end();
            });
        for (const [url, method, status] of [
            ['/cluster/nodes?database=%2Flocal&x=a%2Bb', 'GET', 200],
            ['/vDisk?nodeId=42', 'HEAD', 200],
            ['/', 'GET', 200],
            ['/monitoring/cluster/nodes', 'GET', 200],
            ['/viewer/json/nodes', 'GET', 200],
            ['/cluster/nodes', 'POST', 200],
            ['/missing', 'GET', 404],
        ] as const) {
            const response = await request(url, method);
            expect(response).toMatchObject({
                status,
                body: method === 'HEAD' ? '' : url,
                headers: {'x-method': method},
            });
            expect(response.headers.location).toBeUndefined();
        }
        let body = '';
        const upload = http.request(origin + '/stream', {
            method: 'POST',
            agent: false,
            headers: {'x-probe': 'kept'},
        });
        upload.setTimeout(4000, () => upload.destroy(new Error('Streaming response stalled')));
        const responding = once(upload, 'response');
        upload.write('first');
        const [response] = await responding;
        expect(response.headers['x-probe']).toBe('kept');
        response.on('data', (chunk: Buffer) => {
            body += chunk;
        });
        const ended = once(response, 'end');
        await once(response, 'data');
        expect(body).toBe('first');
        upload.end('last');
        await ended;
        expect(body).toBe('firstlast');
        upstream.closeAllConnections();
        await new Promise<void>((resolve) => upstream.close(() => resolve()));
        await expect(request('/viewer/json/nodes')).rejects.toMatchObject({code: 'ECONNRESET'});
    } finally {
        proxy?.close();
        upstream.closeAllConnections();
        upstream.close();
    }
});
