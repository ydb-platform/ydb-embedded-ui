const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const image = 'mcr.microsoft.com/playwright:v1.58.0-noble';
const runner = path.resolve(__dirname, '../../../scripts/playwright-docker.sh');
const command = fs
    .readFileSync(runner, 'utf8')
    .match(/PLAYWRIGHT_COMMAND=\$\(cat <<'SCRIPT'\n([\s\S]*?)\nSCRIPT\n\)/)?.[1];
assert.ok(command, 'Runner must provide its container command');
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
module.exports = {testDir: '.', retries: 0, reporter: [['blob', {outputDir: '/blobs'}]]};
CONFIG
cat > fixture.spec.js <<'TEST'
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
test('passes', () => expect(1).toBe(1));
test('fails with attachment', async ({}, info) => {
    const file = info.outputPath('proof.txt');
    fs.writeFileSync(file, 'release report attachment');
    await info.attach('proof', {path: file, contentType: 'text/plain'});
    expect(1).toBe(2);
});
TEST
if npx --no playwright test; then
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
        [1, 1, 0, 0],
    );
    assert.ok(fs.statSync(path.join(artifacts, 'playwright-report/index.html')).size > 0);
    const data = path.join(artifacts, 'playwright-report/data');
    assert.ok(
        fs
            .readdirSync(data)
            .some(
                (file) =>
                    fs.readFileSync(path.join(data, file), 'utf8') === 'release report attachment',
            ),
    );
    assert.equal(digest(), before);
    assert.deepEqual(fs.readdirSync(blobs), inputs);
    console.info(
        'Release smoke passed: separate frontend/test checkouts; test-revision report merge; HTML, JSON and attachment retained; input ZIP unchanged.',
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
