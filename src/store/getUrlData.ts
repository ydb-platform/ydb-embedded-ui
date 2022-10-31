import url from 'url';

export const getUrlData = (href: string, singleClusterMode: boolean) => {
    if (!singleClusterMode) {
        const {backend, clusterName} = url.parse(href, true).query;
        return {
            basename: '/',
            backend,
            clusterName,
        };
    } else if (window.custom_backend) {
        const {backend} = url.parse(href, true).query;
        return {
            basename: '/',
            backend: backend || window.custom_backend,
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
