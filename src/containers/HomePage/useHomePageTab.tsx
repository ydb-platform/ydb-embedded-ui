import {useRouteMatch} from 'react-router-dom';

import type {HomePageTab} from '../../routes';
import routes from '../../routes';

export function useHomePageTab() {
    const match = useRouteMatch<{activeTab: string | undefined}>(routes.homePage);
    return match?.params.activeTab as HomePageTab;
}
