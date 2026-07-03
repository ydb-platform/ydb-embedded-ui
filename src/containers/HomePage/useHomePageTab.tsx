import {useRouteMatch} from 'react-router-dom';

import type {HomePageTab} from '../../routes';
import routes from '../../routes';

export function useHomePageTab() {
    const match = useRouteMatch<{activeTab: string | undefined}>({
        path: routes.homePage,
        exact: true,
    });
    return match?.params.activeTab as HomePageTab;
}

export function isDatabasesHomePageTab(homePageTab?: HomePageTab) {
    return homePageTab === 'databases';
}

export function isClustersHomePageTab(homePageTab?: HomePageTab) {
    return homePageTab === 'clusters';
}

export function useIsDatabasesHomePage() {
    return isDatabasesHomePageTab(useHomePageTab());
}

export function useIsClustersHomePage() {
    return isClustersHomePageTab(useHomePageTab());
}
