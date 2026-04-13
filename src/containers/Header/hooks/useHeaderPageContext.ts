import {useLocation} from 'react-router-dom';

import type {HomePageTab} from '../../../routes';
import {checkIsClusterPage, checkIsHomePage, checkIsTenantPage} from '../../../routes';
import {
    useMetaCapabilitiesLoaded,
    useMetaEnvironmentsAvailable,
} from '../../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {useSetting, useTypedSelector} from '../../../utils/hooks';
import {
    useClusterNameFromQuery,
    useDatabaseFromQuery,
} from '../../../utils/hooks/useDatabaseFromQuery';
import {useIsViewerUser} from '../../../utils/hooks/useIsUserAllowedToMakeChanges';
import {useHomePageTab} from '../../HomePage/useHomePageTab';
import {useNavigationV2Enabled} from '../../Tenant/utils/useNavigationV2Enabled';

export function useHeaderPageContext() {
    const metaCapabilitiesLoaded = useMetaCapabilitiesLoaded();
    const {page, pageBreadcrumbsOptions} = useTypedSelector((state) => state.header);
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);
    const isViewerUser = useIsViewerUser();
    const databasesPageAvailable = useMetaEnvironmentsAvailable();
    const isV2NavigationEnabled = useNavigationV2Enabled();

    const [savedHomePageTab] = useSetting<HomePageTab | undefined>(SETTING_KEYS.HOME_PAGE_TAB);
    const [savedDatabasesEnvironment] = useSetting<string | undefined>(
        SETTING_KEYS.DATABASES_PAGE_ENVIRONMENT,
    );

    const homePageTabFromPath = useHomePageTab();

    const database = useDatabaseFromQuery();
    const clusterName = useClusterNameFromQuery();

    const location = useLocation();

    const isDatabasePage = checkIsTenantPage(location.pathname);
    const isClusterPage = checkIsClusterPage(location.pathname);
    const isHomePage = checkIsHomePage(location.pathname);
    const isDatabasesHomePage = isHomePage && homePageTabFromPath === 'databases';
    const isClustersHomePage = isHomePage && homePageTabFromPath === 'clusters';

    return {
        metaCapabilitiesLoaded,
        page,
        pageBreadcrumbsOptions,
        singleClusterMode,
        isViewerUser,
        databasesPageAvailable,
        isV2NavigationEnabled,
        savedHomePageTab,
        savedDatabasesEnvironment,
        homePageTabFromPath,
        database,
        clusterName,
        isDatabasePage,
        isClusterPage,
        isHomePage,
        isDatabasesHomePage,
        isClustersHomePage,
    };
}
