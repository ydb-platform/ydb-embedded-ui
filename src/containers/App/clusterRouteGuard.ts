import {checkIsClusterPage} from '../../routes';

export function shouldRedirectClusterRouteToRoot({
    singleClusterMode,
    pathname,
    search,
}: {
    singleClusterMode: boolean;
    pathname: string;
    search: string;
}) {
    if (singleClusterMode || !checkIsClusterPage(pathname)) {
        return false;
    }

    return !new URLSearchParams(search).get('clusterName');
}
