export const getUrlData = ({
    href,
    singleClusterMode,
    customBackend,
}: {
    href: string;
    singleClusterMode: boolean;
    customBackend?: string;
}) => {
    // UI could be located in "monitoring" or "ui" folders
    const parsedPrefix = window.location.pathname.match(/.*(?=\/(monitoring|ui)\/)/) || [];
    const basenamePrefix = parsedPrefix.length > 0 ? parsedPrefix[0] : '';
    const folder = parsedPrefix.length > 1 ? parsedPrefix[1] : '';

    let basename = '';

    if (basenamePrefix || folder) {
        basename = basenamePrefix + '/' + folder;
    }

    const urlSearchParams = new URL(href).searchParams;
    const backend = urlSearchParams.get('backend') ?? undefined;
    const clusterName = urlSearchParams.get('clusterName') ?? undefined;

    if (!singleClusterMode) {
        // Multi-cluster version
        // Cluster and backend are determined by url params
        return {
            basename,
            backend,
            clusterName,
        };
    } else if (customBackend) {
        // Single-cluster version
        // UI and backend are on different hosts
        // There is a backend url param for requests
        return {
            basename,
            backend: backend ? backend : customBackend,
        };
    } else {
        // Single-cluster version
        // UI and backend are located on the same host
        // We use the the host for backend requests
        return {
            basename,
            backend: basenamePrefix || '',
        };
    }
};
