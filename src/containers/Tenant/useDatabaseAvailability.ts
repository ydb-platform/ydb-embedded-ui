import {authenticationApi} from '../../store/reducers/authentication/authentication';
import {capabilitiesApi} from '../../store/reducers/capabilities/capabilities';
import {useEmMetaAvailable} from '../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import {
    getDatabaseAvailability,
    getRuntimeTenant,
    isTenantRequestReady,
} from '../../store/reducers/tenant/availability';
import {useTenantBaseInfo} from '../../store/reducers/tenant/tenant';
import {
    useClusterNameFromQuery,
    useDatabaseFromQuery,
} from '../../utils/hooks/useDatabaseFromQuery';
import {useDatabasesV2} from '../../utils/hooks/useDatabasesV2';

export function useIsMetaDatabaseCandidate() {
    const database = useDatabaseFromQuery();
    const clusterName = useClusterNameFromQuery();
    const metaAvailable = useEmMetaAvailable();
    return Boolean(database && clusterName && window.api.meta && metaAvailable);
}

export function useDatabaseAvailability({skip = false}: {skip?: boolean} = {}) {
    const database = useDatabaseFromQuery() ?? '';
    const clusterName = useClusterNameFromQuery();
    const candidate = useIsMetaDatabaseCandidate();
    const whoami = authenticationApi.useWhoamiQuery({database}, {skip: skip || !candidate});
    const capabilities = capabilitiesApi.useGetClusterCapabilitiesQuery(
        {database},
        {skip: skip || !candidate},
    );
    const cluster = useClusterBaseInfo();
    const isMetaDatabasesAvailable = useDatabasesV2();
    const composed = candidate && isMetaDatabasesAvailable;
    const isReady = isTenantRequestReady({
        whoamiData: whoami.currentData,
        whoamiError: whoami.error,
        clusterInfoResolved: cluster.isResolved,
    });
    const tenant = useTenantBaseInfo(database, clusterName, {skip: skip || !composed || !isReady});
    const availability = getDatabaseAvailability({
        database,
        tenant: tenant.databaseData,
        tenantError: tenant.error,
        whoamiError: whoami.error,
        capabilitiesError: capabilities.error,
    });
    const controlPlaneOnly = composed && availability.controlPlaneOnly;
    const runtimeTenant = getRuntimeTenant({
        ...availability,
        controlPlaneOnly,
        tenant: tenant.databaseData,
        whoamiData: whoami.currentData,
        whoamiError: whoami.error,
    });

    return {
        ...availability,
        controlPlaneOnly,
        composed,
        isReady,
        runtimeAuthorized: Boolean(
            whoami.currentData && !whoami.error && !availability.authorizationError,
        ),
        database,
        clusterName,
        tenant,
        runtimeTenant,
        isLoading: !skip && (!isReady || (composed && tenant.isLoading)),
        retry: () => {
            if (composed && isReady) {
                tenant.refetch();
            }
            whoami.refetch();
            capabilities.refetch();
        },
    };
}
