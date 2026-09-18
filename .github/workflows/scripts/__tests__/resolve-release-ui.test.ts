import {resolveRelease} from '../resolve-release-ui';

const input = {ydbTag: '26.2.1.14', ydbSha: 'a'.repeat(40), workflowSha: 'c'.repeat(40)};
const uiSha = 'b'.repeat(40);
const imageDigest = `sha256:${'d'.repeat(64)}`;
const ydbCommit = `ydb-platform/ydb/commits/${input.ydbTag}`;
const uiRepo = 'ydb-platform/ydb-embedded-ui';
const uiFile = (name: string) => `${uiRepo}/contents/${name}?ref=${uiSha}`;
const file = (content: string) => ({
    encoding: 'base64',
    content: Buffer.from(content).toString('base64'),
});

function fixture(version = '18.1.0') {
    const viewer = `ydb-platform/ydb/contents/ydb/core/viewer/monitoring`;
    const responses: Record<string, ReturnType<typeof file> | {sha: string} | Error> = {
        [ydbCommit]: {sha: input.ydbSha},
        [`${uiRepo}/commits/v${version}`]: {sha: uiSha},
        [`${viewer}/CHANGELOG.md?ref=${input.ydbSha}`]: file(
            `## [${version}](https://example.test)`,
        ),
        [`${viewer}/index.html?ref=${input.ydbSha}`]: file('<html>release UI</html>'),
        [uiFile('package.json')]: file(JSON.stringify({version})),
        [uiFile('package-lock.json')]: file(
            JSON.stringify({packages: {'node_modules/@playwright/test': {version: '1.58.0'}}}),
        ),
    };
    const run = (options: {ydbTag: string; ydbSha?: string; workflowSha: string} = input) =>
        resolveRelease(
            options,
            async (path: string) => {
                const response = responses[path];
                if (!response || response instanceof Error) {
                    throw response || new Error(`Unexpected GitHub path: ${path}`);
                }
                return response;
            },
            async () => imageDigest,
        );
    return {responses, run};
}

test.each(['18.1.0', '15.6.0-hotfix.1'])(
    'resolves matching release identity for UI %s',
    async (version) => {
        await expect(fixture(version).run()).resolves.toMatchObject({
            ydb_sha: input.ydbSha,
            ui_version: version,
            ui_sha: uiSha,
            playwright_version: '1.58.0',
            image_digest: imageDigest,
        });
    },
);

test.each([undefined, ''])(
    'resolves the tag commit when the expected SHA is %p',
    async (ydbSha) => {
        await expect(fixture().run({...input, ydbSha})).resolves.toMatchObject({
            ydb_sha: input.ydbSha,
            ui_sha: uiSha,
            image_digest: imageDigest,
        });
    },
);

test('rejects a malformed explicit or resolved YDB SHA', async () => {
    await expect(fixture().run({...input, ydbSha: 'main'})).rejects.toThrow('full commit SHAs');
    const {responses, run} = fixture();
    responses[ydbCommit] = {sha: 'main'};
    await expect(run({...input, ydbSha: ''})).rejects.toThrow(
        'YDB tag did not resolve to a commit SHA',
    );
});

test('rejects a YDB tag pointing to a different commit', async () => {
    const {responses, run} = fixture();
    responses[ydbCommit] = {sha: 'f'.repeat(40)};
    await expect(run()).rejects.toThrow('YDB tag resolves to');
});

test('does not substitute main for a missing UI release tag', async () => {
    const {responses, run} = fixture();
    responses[`${uiRepo}/commits/v18.1.0`] = new Error('UI release tag missing');
    responses[`${uiRepo}/commits/main`] = {sha: uiSha};
    await expect(run()).rejects.toThrow('UI release tag missing');
});

test.each([
    ['package.json', JSON.stringify({version: '19.0.0'}), 'does not match'],
    ['package-lock.json', '{}', 'Playwright version'],
])('requires matching metadata in %s', async (name, content, error) => {
    const {responses, run} = fixture();
    responses[uiFile(name)] = file(content);
    await expect(run()).rejects.toThrow(error);
});

test.each(['nightly', '26.2.1.14\nimage=other'])('rejects non-release input %j', async (ydbTag) => {
    await expect(fixture().run({...input, ydbTag})).rejects.toThrow('release tag');
});
