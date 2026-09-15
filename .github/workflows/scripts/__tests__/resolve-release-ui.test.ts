import {getEmbeddedVersion, resolveRelease} from '../resolve-release-ui';

const ydbSha = 'a'.repeat(40);
const uiSha = 'b'.repeat(40);
const workflowSha = 'c'.repeat(40);
const imageDigest = `sha256:${'d'.repeat(64)}`;
const file = (content: string) => ({
    encoding: 'base64',
    content: Buffer.from(content).toString('base64'),
});

function githubFixture(version: string) {
    return jest.fn(async (path: string) => {
        if (path.includes('ydb/commits/')) {
            return {sha: ydbSha};
        }
        if (path.includes('embedded-ui/commits/')) {
            return {sha: uiSha};
        }
        if (path.includes('CHANGELOG.md')) {
            return file(`# Changelog\n\n## [${version}](https://example.test)\n`);
        }
        if (path.includes('package.json')) {
            return file(JSON.stringify({version}));
        }
        if (path.includes('package-lock.json')) {
            return file(
                JSON.stringify({packages: {'node_modules/@playwright/test': {version: '1.58.0'}}}),
            );
        }
        return file('<html>release UI</html>');
    });
}

describe('release UI identity', () => {
    test.each(['18.1.0', '15.6.0-hotfix.1'])(
        'resolves the embedded %s test commit',
        async (version) => {
            const github = githubFixture(version);
            const result = await resolveRelease(
                {ydbTag: '26.2.1.14', ydbSha, workflowSha},
                github,
                async () => imageDigest,
            );
            expect(result).toMatchObject({
                ydb_tag: '26.2.1.14',
                ydb_sha: ydbSha,
                ui_version: version,
                ui_sha: uiSha,
                workflow_sha: workflowSha,
                image_digest: imageDigest,
            });
            expect(github).toHaveBeenCalledWith(`ydb-platform/ydb-embedded-ui/commits/v${version}`);
            expect(github).toHaveBeenCalledWith(
                `ydb-platform/ydb-embedded-ui/contents/package.json?ref=${uiSha}`,
            );
            expect(github.mock.calls.some(([path]) => path.includes('main'))).toBe(false);
        },
    );

    test('rejects a different YDB commit before resolving UI or pulling an image', async () => {
        const github = jest.fn(async () => ({sha: uiSha}));
        const digest = jest.fn();
        await expect(
            resolveRelease({ydbTag: '26.2.1.14', ydbSha, workflowSha}, github, digest),
        ).rejects.toThrow('expected');
        expect(github).toHaveBeenCalledTimes(1);
        expect(digest).not.toHaveBeenCalled();
    });

    test('fails when the embedded version has no UI tag', async () => {
        const fixture = githubFixture('18.1.0');
        const github = async (path: string) => {
            if (path.includes('embedded-ui/commits/')) {
                throw new Error('HTTP 404');
            }
            return fixture(path);
        };
        await expect(
            resolveRelease({ydbTag: '26.2.1.14', ydbSha, workflowSha}, github),
        ).rejects.toThrow('HTTP 404');
    });

    test('rejects a UI package version mismatch', async () => {
        const fixture = githubFixture('18.1.0');
        const github = (path: string) =>
            path.includes('package.json')
                ? Promise.resolve(file('{"version":"19.0.0"}'))
                : fixture(path);
        await expect(
            resolveRelease({ydbTag: '26.2.1.14', ydbSha, workflowSha}, github),
        ).rejects.toThrow('does not match');
    });

    test.each(['nightly', 'latest', '26.2\nimage=x', '26.2.1.14; echo nope'])(
        'rejects non-release input %s',
        async (ydbTag) => {
            const github = jest.fn();
            await expect(resolveRelease({ydbTag, ydbSha, workflowSha}, github)).rejects.toThrow(
                'release tag',
            );
            expect(github).not.toHaveBeenCalled();
        },
    );

    test('rejects missing changelog version and invalid registry digest', async () => {
        expect(() => getEmbeddedVersion('# Changelog')).toThrow('no release version');
        await expect(
            resolveRelease(
                {ydbTag: '26.2.1.14', ydbSha, workflowSha},
                githubFixture('18.1.0'),
                async () => 'latest',
            ),
        ).rejects.toThrow('digest');
    });

    test('rejects a missing Playwright lockfile version before resolving the image', async () => {
        const fixture = githubFixture('18.1.0');
        const github = (path: string) =>
            path.includes('package-lock.json') ? Promise.resolve(file('{}')) : fixture(path);
        const digest = jest.fn();
        await expect(
            resolveRelease({ydbTag: '26.2.1.14', ydbSha, workflowSha}, github, digest),
        ).rejects.toThrow('Playwright version');
        expect(digest).not.toHaveBeenCalled();
    });
});
