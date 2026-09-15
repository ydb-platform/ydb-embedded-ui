const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {IMAGE_REPOSITORY} = require('./resolve-release-ui');

function verifyImage(provenance, container, image, index) {
    if (
        container.Image !== image.Id ||
        !image.RepoDigests?.includes(`${IMAGE_REPOSITORY}@${provenance.image_digest}`)
    ) {
        throw new Error('Running container does not match the resolved image digest');
    }
    if (image.Config?.Labels?.['ydb.revision'] !== provenance.ydb_sha) {
        throw new Error('Running image ydb.revision does not match the release SHA');
    }
    if (createHash('sha256').update(index).digest('hex') !== provenance.index_sha256) {
        throw new Error('Served /monitoring/ index does not match the release sources');
    }
    return {image_id: image.Id, image_digest: provenance.image_digest, index_verified: true};
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

function summarize(report, provenance, {shards, jobs, artifacts}) {
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
        return {status: 'incomplete', summary: problems.join('\n\n')};
    }
    const status =
        jobs === 'success' && stats.unexpected === 0 && stats.flaky === 0 ? 'passed' : 'failed';
    return {
        status,
        summary: `Reports: 8/8 shards. Test jobs: ${jobs}.\n\nTests: ${stats.expected} passed, ${stats.unexpected} failed, ${stats.flaky} flaky, ${stats.skipped} skipped.`,
    };
}

function readJson(file) {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : undefined;
}

async function main() {
    const [command, ...args] = process.argv.slice(2);
    if (command === 'verify') {
        const provenance = JSON.parse(fs.readFileSync(args[0], 'utf8'));
        const container = JSON.parse(
            execFileSync('docker', ['inspect', args[1]], {encoding: 'utf8'}),
        )[0];
        const image = JSON.parse(
            execFileSync('docker', ['image', 'inspect', container.Image], {encoding: 'utf8'}),
        )[0];
        const response = await fetch('http://localhost:8765/monitoring/', {
            signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) {
            throw new Error(`Monitoring returned HTTP ${response.status}`);
        }
        console.info(verifyImage(provenance, container, image, await response.text()));
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
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = {verifyImage, collectReports, summarize, sanitizeArtifacts};
