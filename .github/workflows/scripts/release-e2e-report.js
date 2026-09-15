const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {IMAGE_REPOSITORY} = require('./resolve-release-ui');
const {readTestResults} = require('./utils/results');

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

function collectReports(directory, destination, total = 8) {
    fs.mkdirSync(destination, {recursive: true});
    const shards = [];
    for (let shard = 1; shard <= total; shard++) {
        const root = path.join(directory, `release-e2e-shard-${shard}`);
        const recordPath = path.join(root, 'release-artifacts', 'shard.json');
        const blobPath = path.join(root, 'ui', 'blob-report');
        const blobs = fs.existsSync(blobPath)
            ? fs.readdirSync(blobPath).filter((file) => file.endsWith('.zip'))
            : [];
        let record;
        try {
            record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
        } catch {
            record = {shard, error: 'Missing or invalid shard record'};
        }
        for (const file of blobs) {
            fs.copyFileSync(path.join(blobPath, file), path.join(destination, `${shard}-${file}`));
        }
        shards.push({...record, shard, blobs: blobs.length});
    }
    return shards;
}

function isShardComplete(shard, provenance) {
    return (
        shard.setup === 'success' &&
        shard.identity === 'success' &&
        ['success', 'failure'].includes(shard.tests) &&
        shard.blobs === 1 &&
        shard.image_digest === provenance?.image_digest
    );
}

function summarize(shards, report, provenance) {
    const problems = [];
    if (shards.length !== 8 || new Set(shards.map((shard) => shard.shard)).size !== 8) {
        problems.push('Expected exactly eight distinct shards');
    }
    if (!provenance) {
        problems.push('Release identity could not be resolved');
    }
    for (const shard of shards) {
        if (!isShardComplete(shard, provenance)) {
            problems.push(`Shard ${shard.shard}: setup, identity or report incomplete`);
        }
    }
    const stats = report?.stats;
    if (
        !stats ||
        ['expected', 'unexpected', 'flaky', 'skipped'].some(
            (key) => !Number.isInteger(stats[key]) || stats[key] < 0,
        ) ||
        stats.expected + stats.unexpected + stats.flaky === 0
    ) {
        problems.push('Merged report is missing or contains no executed tests');
    }
    if (report?.errors?.length) {
        problems.push('Playwright reported errors outside individual tests');
    }
    const complete = problems.length === 0;
    let status = 'incomplete';
    if (complete) {
        status =
            stats.unexpected || stats.flaky || shards.some((shard) => shard.tests !== 'success')
                ? 'failed'
                : 'passed';
    }
    return {status, complete, provenance, shards, stats, problems};
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
        const identity = verifyImage(provenance, container, image, await response.text());
        fs.writeFileSync('release-artifacts/image.json', JSON.stringify(identity, null, 2));
    } else if (command === 'record') {
        const imagePath = 'release-artifacts/image.json';
        const image = fs.existsSync(imagePath)
            ? JSON.parse(fs.readFileSync(imagePath, 'utf8'))
            : {};
        fs.writeFileSync(
            'release-artifacts/shard.json',
            JSON.stringify(
                {
                    shard: Number(process.env.SHARD),
                    setup: process.env.SETUP_OUTCOME,
                    identity: process.env.IDENTITY_OUTCOME,
                    tests: process.env.TEST_OUTCOME,
                    ...image,
                },
                null,
                2,
            ),
        );
    } else if (command === 'collect') {
        const shards = collectReports(args[0], args[1]);
        fs.writeFileSync('release-artifacts/shards.json', JSON.stringify(shards, null, 2));
        fs.appendFileSync(
            process.env.GITHUB_OUTPUT,
            `has_blobs=${shards.some((shard) => shard.blobs > 0)}\n`,
        );
    } else if (command === 'summarize') {
        const shards = JSON.parse(fs.readFileSync('release-artifacts/shards.json', 'utf8'));
        const provenancePath = 'downloaded/release-e2e-provenance/provenance.json';
        const provenance = fs.existsSync(provenancePath)
            ? JSON.parse(fs.readFileSync(provenancePath, 'utf8'))
            : undefined;
        const reportPath = 'ui/playwright-artifacts/test-results.json';
        const report = fs.existsSync(reportPath)
            ? JSON.parse(fs.readFileSync(reportPath, 'utf8'))
            : undefined;
        const summary = summarize(shards, report, provenance);
        if (report) {
            const {total, passed, failed, flaky, skipped} = readTestResults(reportPath);
            summary.counts = {total, passed, failed, flaky, skipped};
        }
        fs.writeFileSync('release-artifacts/summary.json', JSON.stringify(summary, null, 2));
        const text = `Release UI e2e: ${summary.status}\n\n${JSON.stringify(summary, null, 2)}`;
        const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        fs.writeFileSync(
            'release-artifacts/summary.html',
            `<!doctype html><meta charset="utf-8"><title>Release UI e2e</title><pre>${escaped}</pre>`,
        );
        fs.appendFileSync(
            process.env.GITHUB_STEP_SUMMARY,
            `### Release UI e2e: ${summary.status}\n\n\`\`\`json\n${JSON.stringify({provenance, stats: summary.stats, problems: summary.problems}, null, 2)}\n\`\`\`\n`,
        );
        if (summary.status !== 'passed') {
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

module.exports = {verifyImage, collectReports, summarize};
