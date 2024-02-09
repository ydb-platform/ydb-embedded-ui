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
            backend,
            clusterName,
        };
    } else if (customBackend) {
        const {backend} = url.parse(href, true).query;
        return {
            basename: '/',
            backend: backend || customBackend,
        };
    } else {
        const parsedPrefix = window.location.pathname.match(/.*(?=\/monitoring)/) || [];
        const basenamePrefix = Boolean(parsedPrefix.length) && parsedPrefix[0];
        const basename = [basenamePrefix, 'monitoring'].filter(Boolean).join('/');

        return {
            basename,
            backend: basenamePrefix || '',
        };
    }
};
