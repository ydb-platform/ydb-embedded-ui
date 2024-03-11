import url from 'url';

export const getUrlData = ({
    href,
    singleClusterMode,
    customBackend,
}: {
    href: string;
    singleClusterMode: boolean;
    customBackend?: string;
}) => {
    if (!singleClusterMode) {
        const {backend, clusterName} = url.parse(href, true).query;
        return {
            basename: '/',
            backend: backend ? String(backend) : backend,
            clusterName: clusterName ? String(clusterName) : clusterName,
        };
    } else if (customBackend) {
        const {backend} = url.parse(href, true).query;
        return {
            basename: '/',
            backend: backend ? String(backend) : customBackend,
        };
    } else {
        const parsedPrefix = window.location.pathname.match(/.*(?=\/monitoring)/) || [];
        const basenamePrefix = parsedPrefix.length > 0 ? parsedPrefix[0] : '';
        const basename = [basenamePrefix, 'monitoring'].filter(Boolean).join('/');

        return {
            basename,
            backend: basenamePrefix || '',
        };
    }
};
