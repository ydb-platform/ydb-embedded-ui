import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {collectReports, sanitizeArtifacts, summarize, verifyImage} from '../release-e2e-report';

const index = '<html>shipped UI</html>';
const provenance = {
    ydb_sha: 'a'.repeat(40),
    image_digest: `sha256:${'b'.repeat(64)}`,
    index_sha256: createHash('sha256').update(index).digest('hex'),
};
const image = {
    Id: 'sha256:container-image',
    RepoDigests: [`ghcr.io/ydb-platform/local-ydb@${provenance.image_digest}`],
    Config: {Labels: {'ydb.revision': provenance.ydb_sha}},
};
const context = {shards: 8, jobs: 'success', artifacts: 'success'};
const report = {stats: {expected: 80, unexpected: 0, flaky: 0, skipped: 2}, errors: []};

describe('release image proof', () => {
    test('verifies the running image and exact served HTML', () => {
        expect(verifyImage(provenance, {Image: image.Id}, image, index)).toMatchObject({
            image_digest: provenance.image_digest,
            index_verified: true,
        });
    });
    test('rejects a different image, revision, or served UI', () => {
        expect(() => verifyImage(provenance, {Image: 'other'}, image, index)).toThrow('digest');
        expect(() =>
            verifyImage(provenance, {Image: image.Id}, {...image, RepoDigests: []}, index),
        ).toThrow('digest');
        expect(() =>
            verifyImage(provenance, {Image: image.Id}, {...image, Config: {Labels: {}}}, index),
        ).toThrow('revision');
        expect(() =>
            verifyImage(provenance, {Image: image.Id}, image, '<html>dev UI</html>'),
        ).toThrow('Served');
    });
});

describe('report completeness', () => {
    test('removes artifact links without reading or modifying their targets', () => {
        const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-artifact-test-'));
        try {
            const artifacts = path.join(directory, 'artifacts');
            fs.mkdirSync(artifacts);
            const outside = path.join(directory, 'runner-file');
            fs.writeFileSync(outside, 'private fixture');
            fs.symlinkSync(outside, path.join(artifacts, 'unsafe.txt'));
            fs.writeFileSync(path.join(artifacts, 'result.json'), '{}');
            const errors = sanitizeArtifacts(artifacts);
            expect(errors).toEqual([path.join(artifacts, 'unsafe.txt')]);
            expect(fs.readFileSync(outside, 'utf8')).toBe('private fixture');
            expect(fs.readdirSync(artifacts)).toEqual(['result.json']);
            expect(summarize(report, provenance, {...context, artifacts: 'failure'}).status).toBe(
                'incomplete',
            );
        } finally {
            fs.rmSync(directory, {recursive: true, force: true});
        }
    });
    test('passes only a complete successful run', () => {
        expect(summarize(report, provenance, context).status).toBe('passed');
    });
    test('reports both test failures and job failures', () => {
        expect(
            summarize({...report, stats: {...report.stats, unexpected: 3}}, provenance, context)
                .status,
        ).toBe('failed');
        expect(summarize(report, provenance, {...context, jobs: 'failure'}).status).toBe('failed');
    });
    test.each(['cancelled', 'skipped', undefined])('does not pass unfinished jobs (%s)', (jobs) => {
        expect(summarize(report, provenance, {...context, jobs}).status).toBe('incomplete');
    });
    test('does not pass missing identity, partial reports, setup errors or empty results', () => {
        expect(summarize(report, provenance, {...context, shards: 7}).status).toBe('incomplete');
        expect(summarize(undefined, provenance, context).status).toBe('incomplete');
        expect(summarize(report, undefined, context).status).toBe('incomplete');
        expect(
            summarize({...report, errors: [{message: 'global setup failed'}]}, provenance, context)
                .status,
        ).toBe('incomplete');
        expect(
            summarize({...report, stats: {...report.stats, expected: 0}}, provenance, context)
                .status,
        ).toBe('incomplete');
        expect(
            summarize({...report, stats: {...report.stats, expected: -1}}, provenance, context)
                .status,
        ).toBe('incomplete');
    });
    test('collects available blobs and reports all eight shards when one upload is absent', () => {
        const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-e2e-test-'));
        try {
            const shard = path.join(directory, 'release-e2e-shard-1');
            fs.mkdirSync(path.join(shard, 'ui', 'blob-report'), {recursive: true});
            fs.writeFileSync(path.join(shard, 'ui', 'blob-report', 'report.zip'), 'blob');
            const destination = path.join(directory, 'merged');
            expect(collectReports(directory, destination)).toEqual({shards: 1, hasBlobs: true});
            expect(fs.readdirSync(destination)).toEqual(['1-report.zip']);
            fs.writeFileSync(path.join(shard, 'ui', 'blob-report', 'duplicate.zip'), 'blob');
            expect(collectReports(directory, destination)).toEqual({shards: 0, hasBlobs: true});
        } finally {
            fs.rmSync(directory, {recursive: true, force: true});
        }
    });
    test('CLI writes a short job summary and preserves the standard report', () => {
        const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-summary-test-'));
        try {
            const result = path.join(directory, 'ui/playwright-artifacts/test-results.json');
            const identity = path.join(
                directory,
                'downloaded/release-e2e-provenance/provenance.json',
            );
            for (const file of [result, identity]) {
                fs.mkdirSync(path.dirname(file), {recursive: true});
            }
            fs.writeFileSync(result, JSON.stringify(report));
            fs.writeFileSync(identity, JSON.stringify(provenance));
            const jobSummary = path.join(directory, 'job-summary.md');
            const run = (shards: string) =>
                execFileSync(
                    process.execPath,
                    [path.resolve(__dirname, '../release-e2e-report.js'), 'summarize'],
                    {
                        cwd: directory,
                        env: {
                            ...process.env,
                            GITHUB_STEP_SUMMARY: jobSummary,
                            REPORT_SHARDS: shards,
                            TEST_JOBS_RESULT: 'success',
                            SANITIZE_RESULT: 'success',
                        },
                    },
                );
            run('8');
            expect(fs.readFileSync(jobSummary, 'utf8')).toContain('80 passed, 0 failed');
            expect(() => run('7')).toThrow();
            expect(fs.readFileSync(jobSummary, 'utf8')).toContain(
                'Reports received from 7/8 shards',
            );
            expect(fs.readFileSync(result, 'utf8')).toBe(JSON.stringify(report));
            expect(fs.readdirSync(path.dirname(result))).toEqual(['test-results.json']);
            expect(fs.existsSync(path.join(directory, 'release-artifacts'))).toBe(false);
        } finally {
            fs.rmSync(directory, {recursive: true, force: true});
        }
    });
});
