const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const {IMAGE_REPOSITORY, readGithub} = require('./resolve-release-ui');

function verifyImage(provenance, container, image) {
    if (
        container.Image !== image.Id ||
        !image.RepoDigests?.includes(`${IMAGE_REPOSITORY}@${provenance.image_digest}`)
    ) {
        throw new Error('Running container does not match the resolved image digest');
    }
    if (image.Config?.Labels?.['ydb.revision'] !== provenance.ydb_sha) {
        throw new Error('Running image ydb.revision does not match the release SHA');
    }
    return {image_id: image.Id, image_digest: provenance.image_digest};
}

async function readReportSource({runId, repository, workflowSha}, github = readGithub) {
    if (!/^[1-9][0-9]*$/.test(runId || '')) {
        throw new Error('source_run_id must be a numeric GitHub run ID');
    }
    const endpoint = `${repository}/actions/runs/${runId}`;
    const run = await github(endpoint);
    if (
        String(run.id) !== runId ||
        run.repository?.full_name !== repository ||
        run.path !== '.github/workflows/release-e2e.yml' ||
        run.event !== 'workflow_dispatch' ||
        run.head_branch !== 'main' ||
        !/^[a-f0-9]{40}$/.test(run.head_sha || '') ||
        !Number.isInteger(run.run_attempt) ||
        run.run_attempt < 1
    ) {
        throw new Error('Source must be a release-e2e.yml run from main in this repository');
    }
    const jobs = [];
    for (let page = 1; ; page++) {
        const batch = await github(
            `${endpoint}/attempts/${run.run_attempt}/jobs?per_page=100&page=${page}`,
        );
        jobs.push(...batch.jobs);
        if (jobs.length >= batch.total_count || batch.jobs.length === 0) {
            break;
        }
    }
    const names = [
        'Resolve release identity',
        ...Array.from({length: 8}, (_, i) => `Release UI tests (${i + 1}/8)`),
    ];
    const selected = names.map((name) => {
        const matches = jobs.filter((job) => job.name === name);
        return matches.length === 1 ? matches[0] : undefined;
    });
    const tests = selected
        .slice(1)
        .map((job) => job?.steps?.find((step) => step.name === 'Run all release-version tests'));
    const results = [...selected, ...tests];
    const completed = results.every(
        (job) => job?.status === 'completed' && ['success', 'failure'].includes(job.conclusion),
    );
    let jobsResult = 'incomplete';
    if (completed && selected[0].conclusion === 'success') {
        jobsResult = results.some((job) => job.conclusion === 'failure') ? 'failure' : 'success';
    }
    return {
        source_run_id: runId,
        source_run_attempt: run.run_attempt,
        source_workflow_sha: run.head_sha,
        report_workflow_sha: workflowSha,
        jobs_result: jobsResult,
    };
}

function prepareReport(provenance, source) {
    if (
        !provenance ||
        !/^[a-f0-9]{40}$/.test(provenance.ui_sha || '') ||
        !/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(provenance.playwright_version || '') ||
        provenance.workflow_sha !== source.source_workflow_sha
    ) {
        throw new Error('Missing or invalid provenance for the source release run');
    }
    return provenance;
}

function collectReports(directory, destination) {
    fs.mkdirSync(destination, {recursive: true});
    let shards = 0;
    let hasBlobs = false;
    for (let shard = 1; shard <= 8; shard++) {
        const source = path.join(directory, `release-e2e-shard-${shard}`, 'ui/blob-report');
        const blobs = fs.existsSync(source)
            ? fs.readdirSync(source).filter((file) => file.endsWith('.zip'))
            : [];
        if (blobs.length === 1) {
            shards++;
        }
        for (const file of blobs) {
            fs.copyFileSync(path.join(source, file), path.join(destination, `${shard}-${file}`));
            hasBlobs = true;
        }
    }
    return {shards, hasBlobs};
}

function sanitizeArtifacts(directory) {
    const removed = [];
    if (!fs.existsSync(directory)) {
        return removed;
    }
    for (const name of fs.readdirSync(directory)) {
        const file = path.join(directory, name);
        const stat = fs.lstatSync(file);
        if (stat.isDirectory()) {
            removed.push(...sanitizeArtifacts(file));
        } else if (!stat.isFile()) {
            // Never let uploaded container output follow a link into the runner.
            fs.unlinkSync(file);
            removed.push(file);
        }
    }
    return removed;
}

function summarize(report, provenance, {shards, jobs, artifacts, merge}) {
    const frontend = provenance ? `Frontend: ${provenance.frontend_mode ?? 'image'}.\n\n` : '';
    const problems = [];
    if (shards !== 8) {
        problems.push(`Reports received from ${shards}/8 shards`);
    }
    if (!provenance) {
        problems.push('Release identity could not be resolved');
    }
    if (artifacts !== 'success') {
        problems.push('Artifact sanitization did not pass');
    }
    if (!['success', 'failure'].includes(jobs)) {
        problems.push('Test jobs did not complete');
    }
    if (merge !== 'success') {
        problems.push('Report merge did not complete');
    }
    const stats = report?.stats;
    const validStats =
        stats &&
        ['expected', 'unexpected', 'flaky', 'skipped'].every(
            (key) => Number.isInteger(stats[key]) && stats[key] >= 0,
        );
    if (!validStats || stats.expected + stats.unexpected + stats.flaky === 0) {
        problems.push('Merged report is missing or contains no executed tests');
    }
    if (report?.errors?.length) {
        problems.push('Playwright reported errors outside individual tests');
    }
    if (problems.length) {
        return {status: 'incomplete', summary: frontend + problems.join('\n\n')};
    }
    const status =
        jobs === 'success' && stats.unexpected === 0 && stats.flaky === 0 ? 'passed' : 'failed';
    return {
        status,
        summary: `${frontend}Reports: 8/8 shards. Test jobs: ${jobs}.\n\nTests: ${stats.expected} passed, ${stats.unexpected} failed, ${stats.flaky} flaky, ${stats.skipped} skipped.`,
    };
}

function readJson(file) {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : undefined;
}

async function main() {
    const [command, ...args] = process.argv.slice(2);
    if (command === 'source') {
        const source = await readReportSource({
            runId: process.env.SOURCE_RUN_ID,
            repository: process.env.GITHUB_REPOSITORY,
            workflowSha: process.env.GITHUB_WORKFLOW_SHA,
        });
        fs.mkdirSync('report-metadata', {recursive: true});
        fs.writeFileSync('report-metadata/report-source.json', JSON.stringify(source, null, 2));
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `jobs_result=${source.jobs_result}\n`);
        fs.appendFileSync(
            process.env.GITHUB_STEP_SUMMARY,
            `Source: [run ${source.source_run_id}, attempt ${source.source_run_attempt}](https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${source.source_run_id})\n\n`,
        );
    } else if (command === 'prepare') {
        const provenance = prepareReport(
            readJson('downloaded/release-e2e-provenance/provenance.json'),
            readJson('report-metadata/report-source.json'),
        );
        fs.appendFileSync(
            process.env.GITHUB_OUTPUT,
            `ui_sha=${provenance.ui_sha}\nplaywright_version=${provenance.playwright_version}\n`,
        );
    } else if (command === 'verify') {
        const provenance = JSON.parse(fs.readFileSync(args[0], 'utf8'));
        const container = JSON.parse(
            execFileSync('docker', ['inspect', args[1]], {encoding: 'utf8'}),
        )[0];
        const image = JSON.parse(
            execFileSync('docker', ['image', 'inspect', container.Image], {encoding: 'utf8'}),
        )[0];
        console.info(verifyImage(provenance, container, image));
    } else if (command === 'collect') {
        const {shards, hasBlobs} = collectReports(args[0], args[1]);
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `shards=${shards}\nhas_blobs=${hasBlobs}\n`);
    } else if (command === 'sanitize') {
        const removed = sanitizeArtifacts(args[0]);
        if (removed.length) {
            throw new Error(`Unsafe artifact files removed: ${removed.join(', ')}`);
        }
    } else if (command === 'summarize') {
        const {status, summary} = summarize(
            readJson('ui/playwright-artifacts/test-results.json'),
            readJson('downloaded/release-e2e-provenance/provenance.json'),
            {
                shards: Number(process.env.REPORT_SHARDS || 0),
                jobs: process.env.TEST_JOBS_RESULT,
                artifacts: process.env.SANITIZE_RESULT,
                merge: process.env.MERGE_RESULT,
            },
        );
        fs.appendFileSync(
            process.env.GITHUB_STEP_SUMMARY,
            `### Release UI e2e: ${status}\n\n${summary}\n`,
        );
        if (status !== 'passed') {
            process.exitCode = 1;
        }
    } else {
        throw new Error(`Unknown release report command: ${command}`);
    }
}

if (require.main === module) {
    main().catch((error) => {
        if (['source', 'prepare'].includes(process.argv[2])) {
            fs.mkdirSync('report-metadata', {recursive: true});
            fs.writeFileSync('report-metadata/setup-error.txt', error.message);
            fs.appendFileSync(
                process.env.GITHUB_STEP_SUMMARY,
                `Report setup failed: ${error.message}\n`,
            );
        }
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = {
    verifyImage,
    collectReports,
    summarize,
    sanitizeArtifacts,
    readReportSource,
    prepareReport,
};
