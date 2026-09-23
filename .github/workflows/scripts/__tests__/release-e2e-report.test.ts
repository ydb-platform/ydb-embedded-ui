import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
    collectReports,
    prepareReport,
    readReportSource,
    sanitizeArtifacts,
    summarize,
    verifyImage,
} from '../release-e2e-report';

const provenance = {
    ydb_sha: 'a'.repeat(40),
    image_digest: `sha256:${'b'.repeat(64)}`,
    frontend_mode: 'npm-start',
    ui_sha: 'd'.repeat(40),
};
const image = {
    Id: 'sha256:container-image',
    RepoDigests: [`ghcr.io/ydb-platform/local-ydb@${provenance.image_digest}`],
    Config: {Labels: {'ydb.revision': provenance.ydb_sha}},
};
const context = {shards: 8, jobs: 'success', artifacts: 'success', merge: 'success'};
const report = {stats: {expected: 80, unexpected: 0, flaky: 0, skipped: 2}, errors: []};

test('accepts the expected backend image and rejects mismatched digest or revision', () => {
    const container = {Image: image.Id};
    expect(verifyImage(provenance, container, image)).toEqual({
        image_id: image.Id,
        image_digest: provenance.image_digest,
    });
    expect(() => verifyImage(provenance, {Image: 'other'}, image)).toThrow('digest');
    expect(() => verifyImage(provenance, container, {...image, RepoDigests: []})).toThrow('digest');
    expect(() => verifyImage(provenance, container, {...image, Config: {Labels: {}}})).toThrow(
        'revision',
    );
});

test.each(['npm-start', undefined])('labels new and historical frontend modes: %s', (mode) => {
    const result = summarize(report, {...provenance, frontend_mode: mode}, context);
    expect(result.status).toBe('passed');
    expect(result.summary).toContain(`Frontend: ${mode ?? 'image'}`);
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

const repository = 'ydb-platform/ydb-embedded-ui';
const workflowSha = 'c'.repeat(40);
const sourceRun = {
    id: 123,
    run_attempt: 1,
    head_sha: workflowSha,
    head_branch: 'main',
    repository: {full_name: repository},
    path: '.github/workflows/release-e2e.yml',
    event: 'workflow_dispatch',
    status: 'in_progress',
};
const sourceJobs = [
    {name: 'Resolve release identity', status: 'completed', conclusion: 'success'},
    ...Array.from({length: 8}, (_, i) => ({
        name: `Release UI tests (${i + 1}/8)`,
        status: 'completed',
        conclusion: 'failure',
        steps: [
            {name: 'Run all release-version tests', status: 'completed', conclusion: 'failure'},
        ],
    })),
];
const readSource = (run = sourceRun, jobs = sourceJobs, runId = '123') =>
    readReportSource({runId, repository, workflowSha}, async (endpoint: string) => {
        if (endpoint === `${repository}/actions/runs/${runId}`) {
            return run;
        }
        if (
            endpoint === `${repository}/actions/runs/${runId}/attempts/1/jobs?per_page=100&page=1`
        ) {
            return {jobs, total_count: jobs.length};
        }
        throw new Error(`Unexpected GitHub endpoint: ${endpoint}`);
    });

test('recovers completed failed tests while the parent run is still running', async () => {
    const source = await readSource();
    expect(source).toEqual({
        source_run_id: '123',
        source_run_attempt: 1,
        source_workflow_sha: workflowSha,
        report_workflow_sha: workflowSha,
        jobs_result: 'failure',
    });
    expect(summarize(report, provenance, {...context, jobs: source.jobs_result}).status).toBe(
        'failed',
    );
    const ui = {ui_sha: 'd'.repeat(40), playwright_version: '1.58.0', workflow_sha: workflowSha};
    expect(prepareReport(ui, source)).toEqual({...ui, tests_sha: ui.ui_sha});
    const override = {...ui, tests_sha: 'f'.repeat(40)};
    expect(prepareReport(override, source)).toEqual(override);
    const summary = summarize(report, override, context).summary;
    expect(summary).toContain(`UI: ${ui.ui_sha}`);
    expect(summary).toContain(`Tests: ${override.tests_sha}`);
    for (const invalid of [
        undefined,
        {...ui, ui_sha: 'main'},
        {...ui, tests_sha: 'main'},
        {...ui, playwright_version: 'latest'},
        {...ui, workflow_sha: 'e'.repeat(40)},
    ]) {
        expect(() => prepareReport(invalid, source)).toThrow(/provenance/i);
    }
});

test('rejects unrelated source runs and does not accept incomplete jobs', async () => {
    await expect(readSource(sourceRun, sourceJobs, '../123')).rejects.toThrow('source_run_id');
    for (const run of [
        {...sourceRun, path: '.github/workflows/ci.yml'},
        {...sourceRun, repository: {full_name: 'other/repo'}},
        {...sourceRun, head_branch: 'feature'},
    ]) {
        await expect(readSource(run)).rejects.toThrow('release-e2e.yml');
    }
    for (const jobs of [
        sourceJobs.slice(0, -1),
        sourceJobs.map((job, i) => (i === 1 ? {...job, status: 'in_progress'} : job)),
        sourceJobs.map((job, i) => (i === 0 ? {...job, conclusion: 'failure'} : job)),
        sourceJobs.map((job, i) => (i === 1 ? {...job, steps: []} : job)),
    ]) {
        const source = await readSource(sourceRun, jobs);
        expect(summarize(report, provenance, {...context, jobs: source.jobs_result}).status).toBe(
            'incomplete',
        );
    }
    const source = await readSource(
        sourceRun,
        sourceJobs.map((job) => ({
            ...job,
            conclusion: 'success',
            steps: job.steps?.map((step) => ({...step, conclusion: 'success'})),
        })),
    );
    expect(summarize(report, provenance, {...context, jobs: source.jobs_result}).status).toBe(
        'passed',
    );
    expect(summarize(report, provenance, {...context, merge: 'failure'}).status).toBe('incomplete');
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
                        MERGE_RESULT: 'success',
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
