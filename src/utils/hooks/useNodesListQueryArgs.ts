import {matchPath, useLocation} from 'react-router-dom';
import {StringParam, useQueryParams} from 'use-query-params';

import routes from '../../routes';
import {getQueryScope} from '../../store/queryScope';
import {authenticationApi} from '../../store/reducers/authentication/authentication';
import type {NodesListQueryArgs} from '../../store/reducers/nodesList';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {getSettingValue} from '../../store/reducers/settings/settings';
import {TENANT_DIAGNOSTICS_TABS_IDS, TENANT_PAGES_IDS} from '../../store/reducers/tenant/constants';
import {tenantPageSchema} from '../../store/reducers/tenant/types';

import {useDatabaseFromQuery} from './useDatabaseFromQuery';
import {useTypedSelector} from './useTypedSelector';

function isStoragePage(pathname: string, page: string, diagnosticsTab: string) {
    if (matchPath(pathname, {path: routes.storageGroup, exact: true})) {
        return true;
    }
    return (
        Boolean(matchPath(pathname, {path: routes.database, exact: true})) &&
        page !== TENANT_PAGES_IDS.query &&
        diagnosticsTab === TENANT_DIAGNOSTICS_TABS_IDS.storage
    );
}

function isClusterStoragePage(pathname: string) {
    const match = matchPath<{activeTab?: string}>(pathname, {path: routes.cluster, exact: true});
    return match?.params.activeTab === 'storage';
}

export function useIsStoragePage() {
    const {pathname} = useLocation();
    const [query] = useQueryParams({
        databasePage: StringParam,
        tenantPage: StringParam,
        diagnosticsTab: StringParam,
    });
    const initialPage = useTypedSelector((state) =>
        getSettingValue(state, SETTING_KEYS.TENANT_INITIAL_PAGE),
    );
    const diagnosticsTab = useTypedSelector((state) => state.tenant.diagnosticsTab);
    const defaultPage = tenantPageSchema.catch(TENANT_PAGES_IDS.query).parse(initialPage);
    const page = tenantPageSchema.catch(defaultPage).parse(query.databasePage ?? query.tenantPage);
    return (
        isStoragePage(pathname, page, query.diagnosticsTab ?? diagnosticsTab) ||
        isClusterStoragePage(pathname)
    );
}

export function useNodesListQueryArgs(): NodesListQueryArgs {
    const database = useDatabaseFromQuery();
    const storagePage = useIsStoragePage();
    const {currentData: permissions} = authenticationApi.endpoints.whoami.useQueryState({database});

    return {
        database,
        scope: getQueryScope(),
        include_storage: (storagePage && permissions?.IsViewerAllowed === true) || undefined,
    };
}
