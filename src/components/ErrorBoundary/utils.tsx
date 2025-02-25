export async function collectDiagnosticsData(error: Error) {
    return await Promise.all([getUiVersion(), getBackendVersion()]).then(
        ([uiVersion, backendVersion]) => {
            return {
                location: window.location.href,
                userAgent: navigator.userAgent,
                error: {
                    message: prepareErrorMessage(error),
                    stack: prepareErrorStack(error.stack, {trim: true, maxLength: 10}),
                },
                uiVersion,
                backendVersion,
            };
        },
    );
}

export type DiagnosticsData = Awaited<ReturnType<typeof collectDiagnosticsData>>;

// Error could happen on app init, while modules not inited
// Import in try catch blocks to prevent any errors with error data collection
async function getUiVersion() {
    try {
        const packageJson = await import('../../../package.json');
        return packageJson.version;
    } catch (error) {
        return {error: prepareErrorMessage(error)};
    }
}

async function getBackendVersion() {
    try {
        // node_id=. returns data about node that fullfills request
        // normally this request should be fast (200-300ms with good connection)
        // timeout=1000 in order not to wait too much in case everything is broken
        const data = await window.api.viewer.getNodeInfo('.', {timeout: 1000});
        return data?.SystemStateInfo?.[0]?.Version;
    } catch (error) {
        return {error: prepareErrorMessage(error)};
    }
}

function prepareErrorMessage(error: unknown) {
    if (error) {
        if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
            return error.message;
        }
    }

    return '';
}

export function prepareErrorStack(
    stack?: string,
    {trim = true, maxLength}: {trim?: boolean; maxLength?: number} = {},
) {
    return (
        stack
            ?.split('\n')
            .map((line, index) => {
                // Do not prepare line with error message
                if (index === 0) {
                    return line;
                }

                // Remove repeating origin from stack trace location
                const preparedLine = line.replace(`(${window.location.origin}/`, '(/');

                if (trim) {
                    return preparedLine.trim();
                }

                return preparedLine;
            })
            // Do not slice first row
            .slice(0, maxLength ? maxLength + 1 : undefined)
            .join('\n')
    );
}
