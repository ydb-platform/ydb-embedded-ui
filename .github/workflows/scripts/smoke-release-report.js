const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const runner = path.resolve(__dirname, '../../../scripts/playwright-docker.sh');
const command = fs.readFileSync(
    path.resolve(__dirname, '../../../scripts/playwright-container.sh'),
    'utf8',
);

const image = 'mcr.microsoft.com/playwright:v1.58.0-noble';
const workflow = fs.readFileSync(path.resolve(__dirname, '../release-e2e.yml'), 'utf8');
const testCommand = workflow.match(
    /^\s+run: bash controller\/scripts\/playwright-docker\.sh[^\n]+/m,
)?.[0];
const releaseRetries = testCommand?.match(/--retries=\d+\b/)?.[0];
const releaseWorkers = testCommand?.match(/--workers=\d+\b/)?.[0];
const releaseTrace = testCommand?.match(/--trace=[a-z-]+\b/)?.[0];
const releaseVideo = workflow.match(/^\s+PLAYWRIGHT_VIDEO: ([a-z-]+)$/m)?.[1];
assert.ok(releaseRetries, 'Release workflow must specify the retry policy');
assert.ok(releaseWorkers, 'Release workflow must specify the CI worker count');
assert.ok(releaseTrace, 'Release workflow must specify the trace policy');
assert.ok(releaseVideo, 'Release workflow must specify the video policy');
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
            '-e',
            `RELEASE_WORKERS=${releaseWorkers}`,
            '-e',
            `RELEASE_TRACE=${releaseTrace}`,
            '-e',
            `PLAYWRIGHT_VIDEO=${releaseVideo}`,
            '-v',
            `${blobs}:/blobs`,
            '-v',
            `${blobs}:/input:ro`,
            '-e',
            `RELEASE_RUNNER_COMMAND=${command}`,
            image,
            'bash',
            '-c',
            String.raw`
set -euo pipefail
mkdir /tmp/fixture
cd /tmp/fixture
npm install --no-save --ignore-scripts --no-audit --no-fund @playwright/test@1.58.0
cat > playwright.config.js <<'CONFIG'
module.exports = {
    testDir: '.', retries: 0, reporter: [['blob', {outputDir: '/blobs'}]],
    use: {video: process.env.PLAYWRIGHT_VIDEO, screenshot: 'only-on-failure'},
};
CONFIG
cat > fixture.spec.js <<'TEST'
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
test('passes', async ({page}) => {
    await page.setContent('<p>ready</p>');
    await expect(page.getByText('ready')).toBeVisible();
});
test('recovers on retry with attachment', async ({page}, info) => {
    await page.setContent('<p>retry fixture</p>');
    const file = info.outputPath('retry-proof.txt');
    fs.writeFileSync(file, 'release retry attachment');
    await info.attach('retry-proof', {path: file, contentType: 'text/plain'});
    expect(info.retry).toBe(1);
});
test('fails with attachment', async ({page}, info) => {
    await page.setContent('<p>failure fixture</p>');
    const file = info.outputPath('proof.txt');
    fs.writeFileSync(file, 'release report attachment');
    await info.attach('proof', {path: file, contentType: 'text/plain'});
    expect(1).toBe(2);
});
TEST
npx --no playwright test "$RELEASE_RETRIES" "$RELEASE_WORKERS" "$RELEASE_TRACE" --grep 'recovers on retry' --reporter=line
if npx --no playwright test "$RELEASE_RETRIES" "$RELEASE_WORKERS" "$RELEASE_TRACE"; then
    echo 'Fixture should contain a failed test' >&2
    exit 1
fi
if npx --no playwright merge-reports --reporter=json /input > /tmp/readonly.log 2>&1; then
    echo 'Merging directly from the read-only mount unexpectedly succeeded' >&2
    exit 1
fi
grep '/input/resources' /tmp/readonly.log

# Exercise the real container command with two small source archives.
mkdir -p /tmp/release-fixture/{ui,tests/src,bin}
node <<'FIXTURE'
const fs = require('node:fs');
const root = '/tmp/release-fixture/';
for (const [name, dependencies] of [['ui', {}], ['tests', {'@playwright/test': '1.58.0'}]]) {
  fs.writeFileSync(root + name + '/package.json', JSON.stringify({
    name, version: '1.0.0', scripts: {start: 'node server.cjs'}, dependencies,
  }));
  fs.writeFileSync(root + name + '/server.cjs', [
    "let hasTests = true; try { require.resolve('@playwright/test'); } catch { hasTests = false; }",
    "require('node:http').createServer((_, res) => res.end(JSON.stringify({",
    "  frontend: require('./package.json').name, flag: process.env.FIXTURE_FLAG, hasTests,",
    "}))).listen(3000);",
  ].join('\n'));
}
fs.writeFileSync(root + 'tests/src/marker.cjs', "module.exports = 'tests-source';");
fs.writeFileSync(root + 'tests/playwright.config.ts', [
  "export default {testDir: '.', testMatch: '*.test.js', workers: 1, retries: 0,",
  "reporter: [['json', {outputFile: '/tmp/release-fixture/result.json'}]],",
  "webServer: {command: 'npm start', port: 3000, env: {FIXTURE_FLAG: 'from-tests'}},",
  "use: {baseURL: 'http://localhost:3000/'}};",
].join('\n'));
fs.writeFileSync(root + 'tests/identity.test.js', [
  "const {test, expect} = require('@playwright/test');",
  "test('keeps the release frontend and test dependencies separate', async ({request}) => {",
  "  expect(require('./src/marker.cjs')).toBe('tests-source');",
  "  const response = await request.get('/');",
  "  expect(await response.json()).toEqual({frontend: 'ui', flag: 'from-tests', hasTests: false});",
  "});",
].join('\n'));
FIXTURE
for source in ui tests; do
  (cd "/tmp/release-fixture/$source" && npm install --package-lock-only --ignore-scripts --no-audit --no-fund)
done
ui_ref=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
tests_ref=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
tar -czf "/tmp/release-fixture/$ui_ref.tgz" -C /tmp/release-fixture ui
tar -czf "/tmp/release-fixture/$tests_ref.tgz" -C /tmp/release-fixture tests
cat > /tmp/release-fixture/bin/curl <<'CURL'
#!/bin/bash
set -euo pipefail
while [ "$#" -gt 0 ]; do
  case "$1" in
    https://codeload.github.com/*) ref=$(basename "$1") ;;
    --output) shift; output="$1" ;;
  esac
  shift
done
cp "/tmp/release-fixture/$ref.tgz" "$output"
CURL
chmod +x /tmp/release-fixture/bin/curl
mkdir -p /work
cd /work
PATH="/tmp/release-fixture/bin:$PATH" CI=true \
  PLAYWRIGHT_RELEASE_REF="$ui_ref" PLAYWRIGHT_RELEASE_TEST_REF="$tests_ref" \
  PLAYWRIGHT_RELEASE_MODE=test bash -c "$RELEASE_RUNNER_COMMAND"
node -e "require('node:assert/strict').equal(require('/tmp/release-fixture/result.json').stats.expected, 1)"
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
    execFileSync('bash', [runner], {
        stdio: 'inherit',
        env: {
            ...process.env,
            CI: 'true',
            PLAYWRIGHT_RELEASE_MODE: 'report',
            PLAYWRIGHT_RELEASE_REF: '85e1e1d44e7df6b0f69b4a81e92d2336fb809941',
            PLAYWRIGHT_RELEASE_TEST_REF: 'f7d3750c673e65078ccb9ac7d0d96cce153702d8',
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
    assert.equal(report.config.workers, Number(releaseWorkers.split('=')[1]));
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
    for (const result of specs.flatMap((spec) => spec.tests[0].results)) {
        const names = result.attachments.map(({name}) => name);
        assert.deepEqual(
            names.filter((name) => name === 'trace' || name === 'video').sort(),
            result.status === 'failed' ? ['trace', 'video'] : [],
            `Attempt ${result.retry} (${result.status}) must retain only failure recordings`,
        );
        if (result.status === 'failed') {
            assert.ok(names.includes('screenshot'), 'Every failed attempt keeps its screenshot');
        }
    }
    assert.ok(fs.statSync(path.join(artifacts, 'playwright-report/index.html')).size > 0);
    const data = path.join(artifacts, 'playwright-report/data');
    const files = fs.readdirSync(data);
    for (const extension of ['.zip', '.webm', '.png']) {
        assert.ok(
            files.some(
                (file) => file.endsWith(extension) && fs.statSync(path.join(data, file)).size,
            ),
            `Merged HTML report must retain ${extension} attachments`,
        );
    }
    const attachments = files
        .filter((file) => file.endsWith('.txt'))
        .map((file) => fs.readFileSync(path.join(data, file), 'utf8'));
    assert.ok(attachments.includes('release report attachment'));
    assert.ok(attachments.includes('release retry attachment'));
    assert.equal(digest(), before);
    assert.deepEqual(fs.readdirSync(blobs), inputs);
    console.info(
        'Report smoke passed: original and retry failures retain trace/video; successful attempts discard recordings; screenshots and attachments retained; input ZIP unchanged.',
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
