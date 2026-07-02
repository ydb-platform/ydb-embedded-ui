import {useRouteMatch} from 'react-router-dom';

import type {HomePageTab} from '../../routes';
import routes from '../../routes';

export function useHomePageTab() {
    const match = useRouteMatch<{activeTab: string | undefined}>(routes.homePage);
    return match?.params.activeTab as HomePageTab;
}

export function useIsDatabasesHomePage() {
    return useHomePageTab() === 'databases';
}

export function useIsClustersHomePage() {
    return useHomePageTab() === 'clusters';
}
