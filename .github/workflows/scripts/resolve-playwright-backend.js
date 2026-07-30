const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

function resolvePlaywrightBackend(value) {
    const backend = typeof value === 'string' ? value.trim() : '';
    if (!backend) {
        throw new Error('PLAYWRIGHT_APP_BACKEND is required');
    }

    let url;
    try {
        url = new URL(backend);
    } catch {
        throw new Error('PLAYWRIGHT_APP_BACKEND must be an absolute HTTP URL');
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('PLAYWRIGHT_APP_BACKEND must be an absolute HTTP URL');
    }

    if (url.username || url.password) {
        throw new Error('PLAYWRIGHT_APP_BACKEND must not contain credentials');
    }

    if (!LOOPBACK_HOSTNAMES.has(url.hostname)) {
        return {
            backendUrl: backend,
            proxyTargetUrl: undefined,
        };
    }

    const backendSuffix = `${url.pathname}${url.search}${url.hash}`;
    const targetPort = url.port || (url.protocol === 'https:' ? '443' : '80');

    return {
        backendUrl: `${url.protocol}//localhost:8765${backendSuffix === '/' ? '' : backendSuffix}`,
        proxyTargetUrl: `${url.protocol}//host.docker.internal:${targetPort}`,
    };
}

if (require.main === module) {
    try {
        const {backendUrl, proxyTargetUrl = ''} = resolvePlaywrightBackend(process.argv[2]);
        process.stdout.write(`${backendUrl}\t${proxyTargetUrl}\n`);
    } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exitCode = 1;
    }
}

module.exports = {
    resolvePlaywrightBackend,
};
