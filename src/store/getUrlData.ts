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
        const urlSearchParams = new URL(href).searchParams;
        const backend = urlSearchParams.get('backend') ?? undefined;
        const clusterName = urlSearchParams.get('clusterName') ?? undefined;
        return {
            basename: '/',
            backend,
            clusterName,
        };
    } else if (customBackend) {
        const urlSearchParams = new URL(href).searchParams;
        const backend = urlSearchParams.get('backend') ?? undefined;
        return {
            basename: '/',
            backend: backend ? backend : customBackend,
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
