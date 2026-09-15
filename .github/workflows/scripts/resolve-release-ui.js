const {createHash} = require('node:crypto');
const fs = require('node:fs');

const IMAGE_REPOSITORY = 'ghcr.io/ydb-platform/local-ydb';
const SHA_PATTERN = /^[a-f0-9]{40}$/;
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/;

function getEmbeddedVersion(changelog) {
    const version = changelog.match(/^##? \[(\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?)\]/m)?.[1];
    if (!version) {
        throw new Error('Embedded UI changelog has no release version');
    }
    return version;
}

async function readResponse(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30_000),
        redirect: 'error',
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} reading ${url}`);
    }
    return response;
}

async function readGithub(path) {
    const headers = {Accept: 'application/vnd.github+json'};
    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    return (await readResponse(`https://api.github.com/repos/${path}`, {headers})).json();
}

function decodeFile(file) {
    if (file.encoding !== 'base64' || typeof file.content !== 'string') {
        throw new Error('GitHub did not return file contents');
    }
    return Buffer.from(file.content, 'base64').toString('utf8');
}

async function resolveImageDigest(tag) {
    const tokenResponse = await readResponse(
        'https://ghcr.io/token?service=ghcr.io&scope=repository:ydb-platform/local-ydb:pull',
    );
    const {token} = await tokenResponse.json();
    const manifest = await readResponse(
        `https://ghcr.io/v2/ydb-platform/local-ydb/manifests/${encodeURIComponent(tag)}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.oci.image.index.v1+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.docker.distribution.manifest.v2+json',
            },
        },
    );
    const digest = manifest.headers.get('docker-content-digest');
    if (!DIGEST_PATTERN.test(digest || '')) {
        throw new Error('Registry did not return an image digest');
    }
    return digest;
}

async function resolveRelease(
    {ydbTag, ydbSha, workflowSha},
    github = readGithub,
    digest = resolveImageDigest,
) {
    if (!/^\d+(?:\.\d+){2,3}(?:-[A-Za-z0-9.-]+)?$/.test(ydbTag)) {
        throw new Error('ydb_tag must be an exact numeric YDB release tag');
    }
    if (!SHA_PATTERN.test(ydbSha) || !SHA_PATTERN.test(workflowSha)) {
        throw new Error('YDB and workflow revisions must be full commit SHAs');
    }
    const commit = await github(`ydb-platform/ydb/commits/${encodeURIComponent(ydbTag)}`);
    if (commit.sha !== ydbSha) {
        throw new Error(`YDB tag resolves to ${commit.sha}, expected ${ydbSha}`);
    }
    const viewerPath = `ydb-platform/ydb/contents/ydb/core/viewer/monitoring`;
    const changelog = decodeFile(await github(`${viewerPath}/CHANGELOG.md?ref=${ydbSha}`));
    const uiVersion = getEmbeddedVersion(changelog);
    const uiCommit = await github(`ydb-platform/ydb-embedded-ui/commits/v${uiVersion}`);
    if (!SHA_PATTERN.test(uiCommit.sha)) {
        throw new Error('UI tag did not resolve to a commit SHA');
    }
    const uiPackage = JSON.parse(
        decodeFile(
            await github(`ydb-platform/ydb-embedded-ui/contents/package.json?ref=${uiCommit.sha}`),
        ),
    );
    if (uiPackage.version !== uiVersion) {
        throw new Error(`UI package version ${uiPackage.version} does not match ${uiVersion}`);
    }
    const index = decodeFile(await github(`${viewerPath}/index.html?ref=${ydbSha}`));
    const imageDigest = await digest(ydbTag);
    if (!DIGEST_PATTERN.test(imageDigest)) {
        throw new Error('Invalid image digest');
    }
    return {
        ydb_tag: ydbTag,
        ydb_sha: ydbSha,
        ui_version: uiVersion,
        ui_sha: uiCommit.sha,
        image: `${IMAGE_REPOSITORY}:${ydbTag}`,
        image_digest: imageDigest,
        index_sha256: createHash('sha256').update(index).digest('hex'),
        workflow_sha: workflowSha,
    };
}

if (require.main === module) {
    fs.mkdirSync('release-artifacts', {recursive: true});
    resolveRelease({
        ydbTag: process.env.YDB_TAG,
        ydbSha: process.env.YDB_SHA,
        workflowSha: process.env.WORKFLOW_SHA,
    })
        .then((provenance) => {
            fs.writeFileSync(
                'release-artifacts/provenance.json',
                JSON.stringify(provenance, null, 2),
            );
            if (process.env.GITHUB_OUTPUT) {
                fs.appendFileSync(
                    process.env.GITHUB_OUTPUT,
                    Object.entries(provenance)
                        .map(([key, value]) => `${key}=${value}\n`)
                        .join(''),
                );
            }
        })
        .catch((error) => {
            fs.writeFileSync('release-artifacts/setup-error.txt', error.message);
            console.error(error.message);
            process.exitCode = 1;
        });
}

module.exports = {getEmbeddedVersion, resolveRelease, IMAGE_REPOSITORY};
