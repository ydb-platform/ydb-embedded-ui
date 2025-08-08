import {prepareErrorMessage} from '../../utils/prepareErrorMessage';

import packageJson from '../../../package.json';

export async function collectDiagnosticsData(error: Error) {
    return await getBackendVersion().then((backendVersion) => {
        return {
            location: window.location.href,
            userAgent: navigator.userAgent,
            error: {
                message: prepareErrorMessage(error),
                stack: prepareErrorStack(error.stack, {trim: true, maxLines: 10}),
            },
            uiVersion: packageJson.version,
            backendVersion,
        };
    });
}

export type DiagnosticsData = Awaited<ReturnType<typeof collectDiagnosticsData>>;

async function getBackendVersion() {
    try {
        // node_id=. returns data about node that fullfills request
        // normally this request should be fast (200-300ms with good connection)
        // timeout=1000 in order not to wait too much in case everything is broken
        const data = await window.api.viewer.getNodeInfo({nodeId: '.'}, {timeout: 1000});
        return data?.SystemStateInfo?.[0]?.Version;
    } catch (error) {
        return {error: prepareErrorMessage(error)};
    }
}

export function prepareErrorStack(
    stack?: string,
    {trim = true, maxLines}: {trim?: boolean; maxLines?: number} = {},
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
            .slice(0, maxLines ? maxLines + 1 : undefined)
            .join('\n')
    );
}
