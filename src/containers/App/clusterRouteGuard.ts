import {matchPath} from 'react-router-dom';

import routes from '../../routes';

export function shouldRedirectClusterRouteToRoot({
    singleClusterMode,
    pathname,
    search,
}: {
    singleClusterMode: boolean;
    pathname: string;
    search: string;
}) {
    const clusterRouteMatch = matchPath(pathname, {
        path: routes.cluster,
        exact: false,
    });

    if (singleClusterMode || !clusterRouteMatch) {
        return false;
    }

    return !new URLSearchParams(search).get('clusterName');
}
