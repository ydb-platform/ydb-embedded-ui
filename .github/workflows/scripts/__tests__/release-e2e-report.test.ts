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

test('accepts the expected image and rejects mismatched image, revision or HTML', () => {
    const container = {Image: image.Id};
    expect(verifyImage(provenance, container, image, index).index_verified).toBe(true);
    expect(() => verifyImage(provenance, {Image: 'other'}, image, index)).toThrow('digest');
    expect(() => verifyImage(provenance, container, {...image, RepoDigests: []}, index)).toThrow(
        'digest',
    );
    expect(() =>
        verifyImage(provenance, container, {...image, Config: {Labels: {}}}, index),
    ).toThrow('revision');
    expect(() => verifyImage(provenance, container, image, 'dev UI')).toThrow('Served');
});

test('a failed test or job cannot produce a passing summary', () => {
    expect(
        summarize({...report, stats: {...report.stats, unexpected: 3}}, provenance, context).status,
    ).toBe('failed');
    expect(summarize(report, provenance, {...context, jobs: 'failure'}).status).toBe('failed');
});

test('unavailable, empty or interrupted results remain incomplete', () => {
    expect(summarize(undefined, provenance, context).status).toBe('incomplete');
    expect(summarize(report, undefined, context).status).toBe('incomplete');
    expect(
        summarize({...report, stats: {...report.stats, expected: 0}}, provenance, context).status,
    ).toBe('incomplete');
    expect(summarize({...report, errors: ['setup failed']}, provenance, context).status).toBe(
        'incomplete',
    );
    expect(summarize(report, provenance, {...context, jobs: 'cancelled'}).status).toBe(
        'incomplete',
    );
});

describe('report files', () => {
    let directory: string;
    beforeEach(() => {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-report-test-'));
    });
    afterEach(() => {
        fs.rmSync(directory, {recursive: true, force: true});
    });
    const write = (name: string, contents: string) => {
        const file = path.join(directory, name);
        fs.mkdirSync(path.dirname(file), {recursive: true});
        fs.writeFileSync(file, contents);
        return file;
    };

    test('removes unsafe artifact links while preserving their targets and regular reports', () => {
        const outside = write('runner-file', 'private fixture');
        const regular = write('artifacts/result.json', '{}');
        const link = path.join(directory, 'artifacts/unsafe.txt');
        fs.symlinkSync(outside, link);
        expect(sanitizeArtifacts(path.dirname(regular))).toEqual([link]);
        expect(fs.readFileSync(outside, 'utf8')).toBe('private fixture');
        expect(fs.readdirSync(path.dirname(regular))).toEqual(['result.json']);
        expect(summarize(report, provenance, {...context, artifacts: 'failure'}).status).toBe(
            'incomplete',
        );
    });

    test('counts exactly one report per shard, detecting missing and duplicate uploads', () => {
        const blob = (shard: number) => `release-e2e-shard-${shard}/ui/blob-report/report.zip`;
        for (let shard = 1; shard <= 8; shard++) {
            write(blob(shard), 'blob');
        }
        const collect = () => collectReports(directory, path.join(directory, 'merged'));
        expect(collect()).toEqual({shards: 8, hasBlobs: true});
        fs.unlinkSync(path.join(directory, blob(8)));
        expect(collect().shards).toBe(7);
        write(blob(1).replace('report.zip', 'duplicate.zip'), 'blob');
        expect(collect().shards).toBe(6);
    });

    test('CLI preserves the standard report and fails an incomplete run', () => {
        const result = write('ui/playwright-artifacts/test-results.json', JSON.stringify(report));
        write('downloaded/release-e2e-provenance/provenance.json', JSON.stringify(provenance));
        const summary = path.join(directory, 'job-summary.md');
        const run = (shards: string) =>
            execFileSync(
                process.execPath,
                [path.resolve(__dirname, '../release-e2e-report.js'), 'summarize'],
                {
                    cwd: directory,
                    env: {
                        ...process.env,
                        GITHUB_STEP_SUMMARY: summary,
                        REPORT_SHARDS: shards,
                        TEST_JOBS_RESULT: 'success',
                        SANITIZE_RESULT: 'success',
                    },
                },
            );
        run('8');
        expect(fs.readFileSync(summary, 'utf8')).toContain('80 passed, 0 failed');
        expect(() => run('7')).toThrow();
        expect(fs.readFileSync(summary, 'utf8')).toContain('Reports received from 7/8 shards');
        expect(fs.readFileSync(result, 'utf8')).toBe(JSON.stringify(report));
        expect(fs.existsSync(path.join(directory, 'release-artifacts'))).toBe(false);
    });
});
