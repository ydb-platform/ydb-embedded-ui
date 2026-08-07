import {normalizePathSlashes} from '../utils';

export const getUrlData = ({
    singleClusterMode,
    customBackend,
    allowedEnvironments,
}: {
    singleClusterMode: boolean;
    customBackend?: string;
    allowedEnvironments?: string[];
}) => {
    // UI could be located in "monitoring" or "ui" folders
    // my-host:8765/some/path/monitoring/react-router-path or my-host:8765/some/path/ui/react-router-path
    const parsedPrefix = window.location.pathname.match(/.*(?=\/(monitoring|ui)\/)/) || [];
    const basenamePrefix = parsedPrefix.length > 0 ? parsedPrefix[0] : '';
    const folder = parsedPrefix.length > 1 ? parsedPrefix[1] : '';

    let basename = '';

    if (folder && !basenamePrefix) {
        basename = normalizePathSlashes(`/${folder}`);
    } else if (folder && basenamePrefix) {
        basename = normalizePathSlashes(`${basenamePrefix}/${folder}`);
    }

    const urlSearchParams = new URL(window.location.href).searchParams;
    const backend = urlSearchParams.get('backend') ?? undefined;
    const clusterName = urlSearchParams.get('clusterName') ?? undefined;

    if (!singleClusterMode) {
        // Multi-cluster version
        // Cluster and backend are determined by url params
        // Extract environment from the first full path segment or the first route segment after basename
        // if it's in allowedEnvironments list
        // e.g., /cloud-preprod/api/meta3/proxy/cluster/pre-prod_global/monitoring/cluster -> environment: 'cloud-preprod'
        // e.g., /monitoring/cloud-prod/cluster -> environment: 'cloud-prod'
        // e.g., /cloud-prod/cluster -> environment: 'cloud-prod'
        // Environment is only extracted if allowedEnvironments list is provided
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const basenameSegmentsCount = basename.split('/').filter(Boolean).length;
        const environment = [pathSegments[0], pathSegments[basenameSegmentsCount]].find(
            (segment) => segment && allowedEnvironments?.includes(segment),
        );

        return {
            basename,
            backend,
            clusterName,
            environment,
        };
    } else if (customBackend) {
        // Single-cluster version
        // UI and backend are on different hosts
        // There is a backend url param for requests
        return {
            basename,
            backend: backend || customBackend,
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
