const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const image = 'mcr.microsoft.com/playwright:v1.58.0-noble';
const workflow = fs.readFileSync(path.resolve(__dirname, '../release-e2e.yml'), 'utf8');
const testCommand = workflow.match(
    /^\s+run: bash controller\/scripts\/playwright-docker\.sh[^\n]+/m,
)?.[0];
const releaseRetries = testCommand?.match(/--retries=\d+\b/)?.[0];
assert.ok(releaseRetries, 'Release workflow must specify the retry policy');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-report-smoke-'));
const blobs = path.join(directory, 'all-blob-reports');
fs.mkdirSync(blobs);
try {
    // Produce real blobs, then reproduce Playwright's extraction into a read-only input.
    execFileSync(
        'docker',
        [
            'run',
            '--rm',
            '-e',
            `RELEASE_RETRIES=${releaseRetries}`,
            '-v',
            `${blobs}:/blobs`,
            '-v',
            `${blobs}:/input:ro`,
            image,
            'bash',
            '-c',
            String.raw`
set -euo pipefail
mkdir /tmp/fixture
cd /tmp/fixture
npm install --no-save --ignore-scripts --no-audit --no-fund @playwright/test@1.58.0
cat > playwright.config.js <<'CONFIG'
module.exports = {testDir: '.', retries: 0, reporter: [['blob', {outputDir: '/blobs'}]]};
CONFIG
cat > fixture.spec.js <<'TEST'
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
test('passes', () => expect(1).toBe(1));
test('recovers on retry with attachment', async ({}, info) => {
    const file = info.outputPath('retry-proof.txt');
    fs.writeFileSync(file, 'release retry attachment');
    await info.attach('retry-proof', {path: file, contentType: 'text/plain'});
    expect(info.retry).toBe(1);
});
test('fails with attachment', async ({}, info) => {
    const file = info.outputPath('proof.txt');
    fs.writeFileSync(file, 'release report attachment');
    await info.attach('proof', {path: file, contentType: 'text/plain'});
    expect(1).toBe(2);
});
TEST
npx --no playwright test "$RELEASE_RETRIES" --grep 'recovers on retry' --reporter=line
if npx --no playwright test "$RELEASE_RETRIES"; then
    echo 'Fixture should contain a failed test' >&2
    exit 1
fi
if npx --no playwright merge-reports --reporter=json /input > /tmp/readonly.log 2>&1; then
    echo 'Merging directly from the read-only mount unexpectedly succeeded' >&2
    exit 1
fi
grep '/input/resources' /tmp/readonly.log
`,
        ],
        {stdio: 'inherit'},
    );
    const inputs = fs.readdirSync(blobs);
    assert.equal(inputs.length, 1);
    assert.ok(inputs[0].endsWith('.zip'));
    const digest = () =>
        createHash('sha256')
            .update(fs.readFileSync(path.join(blobs, inputs[0])))
            .digest('hex');
    const before = digest();
    execFileSync('bash', [path.resolve(__dirname, '../../../scripts/playwright-docker.sh')], {
        stdio: 'inherit',
        env: {
            ...process.env,
            CI: 'true',
            PLAYWRIGHT_RELEASE_MODE: 'report',
            PLAYWRIGHT_RELEASE_REF: '85e1e1d44e7df6b0f69b4a81e92d2336fb809941',
            PLAYWRIGHT_RELEASE_VERSION: '1.58.0',
            PLAYWRIGHT_RELEASE_OUTPUT: directory,
            PLAYWRIGHT_SHOW_REPORT: '',
        },
    });
    const artifacts = path.join(directory, 'playwright-artifacts');
    const report = JSON.parse(fs.readFileSync(path.join(artifacts, 'test-results.json'), 'utf8'));
    assert.deepEqual(
        [report.stats.expected, report.stats.unexpected, report.stats.skipped, report.stats.flaky],
        [1, 1, 0, 1],
    );
    const specs = report.suites.flatMap((suite) => suite.specs);
    const recovered = specs.find((spec) => spec.title === 'recovers on retry with attachment')
        ?.tests[0];
    assert.equal(recovered?.status, 'flaky');
    assert.deepEqual(
        recovered.results.map(({status, retry}) => ({status, retry})),
        [
            {status: 'failed', retry: 0},
            {status: 'passed', retry: 1},
        ],
    );
    assert.ok(recovered.results[0].attachments.some(({name}) => name === 'retry-proof'));
    const exhausted = specs.find((spec) => spec.title === 'fails with attachment')?.tests[0];
    assert.equal(exhausted?.status, 'unexpected');
    assert.deepEqual(
        exhausted.results.map(({status, retry}) => ({status, retry})),
        [0, 1, 2].map((retry) => ({status: 'failed', retry})),
    );
    assert.ok(fs.statSync(path.join(artifacts, 'playwright-report/index.html')).size > 0);
    const data = path.join(artifacts, 'playwright-report/data');
    const attachments = fs
        .readdirSync(data)
        .map((file) => fs.readFileSync(path.join(data, file), 'utf8'));
    assert.ok(attachments.includes('release report attachment'));
    assert.ok(attachments.includes('release retry attachment'));
    assert.equal(digest(), before);
    assert.deepEqual(fs.readdirSync(blobs), inputs);
    console.info(
        'Report smoke passed: retry recovery and failure attachments retained; 1 passed, 1 failed, 1 flaky; input ZIP unchanged.',
    );
} finally {
    // The runner writes files as root; remove only this smoke's temporary output.
    execFileSync(
        'docker',
        ['run', '--rm', '-v', `${directory}:/cleanup`, image, 'bash', '-c', 'rm -rf /cleanup/*'],
        {stdio: 'inherit'},
    );
    fs.rmdirSync(directory);
}
