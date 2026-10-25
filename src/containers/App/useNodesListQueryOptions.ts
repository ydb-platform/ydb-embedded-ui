import {matchPath, useLocation} from 'react-router-dom';
import {StringParam, useQueryParams} from 'use-query-params';

import routes from '../../routes';
import {getQueryScope} from '../../store/queryScope';
import {authenticationApi} from '../../store/reducers/authentication/authentication';
import type {NodesListQueryArgs} from '../../store/reducers/nodesList';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {STORAGE_TYPES} from '../../store/reducers/storage/constants';
import type {StorageType} from '../../store/reducers/storage/types';
import {storageTypeSchema} from '../../store/reducers/storage/types';
import {TENANT_DIAGNOSTICS_TABS_IDS, TENANT_PAGES_IDS} from '../../store/reducers/tenant/constants';
import {tenantPageSchema} from '../../store/reducers/tenant/types';
import {useAutoRefreshInterval} from '../../utils/hooks/useAutoRefreshInterval';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useSetting} from '../../utils/hooks/useSetting';
import {useTypedSelector} from '../../utils/hooks/useTypedSelector';

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

export function useNodesListQueryOptions(): {
    args: NodesListQueryArgs;
    options: {pollingInterval: number};
} {
    const {pathname} = useLocation();
    const database = useDatabaseFromQuery();
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [query] = useQueryParams({
        databasePage: StringParam,
        tenantPage: StringParam,
        diagnosticsTab: StringParam,
        type: StringParam,
    });
    const [savedStorageType] = useSetting<StorageType>(
        SETTING_KEYS.STORAGE_TYPE,
        STORAGE_TYPES.groups,
    );
    const [initialPage] = useSetting<string>(SETTING_KEYS.TENANT_INITIAL_PAGE);
    const diagnosticsTab = useTypedSelector((state) => state.tenant.diagnosticsTab);
    const {currentData: permissions} = authenticationApi.endpoints.whoami.useQueryState({database});
    const defaultPage = tenantPageSchema.catch(TENANT_PAGES_IDS.query).parse(initialPage);
    const page = tenantPageSchema.catch(defaultPage).parse(query.databasePage ?? query.tenantPage);
    const storageType = storageTypeSchema.parse(query.type ?? savedStorageType);
    const isGroups =
        storageType === STORAGE_TYPES.groups || permissions?.IsMonitoringAllowed === false;
    const storagePage =
        isStoragePage(pathname, page, query.diagnosticsTab ?? diagnosticsTab) ||
        isClusterStoragePage(pathname);
    const shouldPoll = isGroups && storagePage;

    return {
        args: {database, scope: getQueryScope(), include_storage: storagePage || undefined},
        options: {pollingInterval: shouldPoll ? autoRefreshInterval : 0},
    };
}
