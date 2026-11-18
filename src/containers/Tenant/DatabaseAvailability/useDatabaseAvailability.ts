import React from 'react';

import {authenticationApi} from '../../../store/reducers/authentication/authentication';
import {capabilitiesApi} from '../../../store/reducers/capabilities/capabilities';
import {useEmMetaAvailable} from '../../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import {
    getDatabaseAvailability,
    isTenantRequestReady,
} from '../../../store/reducers/tenant/availability';
import type {DatabaseAvailability} from '../../../store/reducers/tenant/availability';
import {useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
import {
    useClusterNameFromQuery,
    useDatabaseFromQuery,
} from '../../../utils/hooks/useDatabaseFromQuery';
import {useDatabasesV2} from '../../../utils/hooks/useDatabasesV2';

const LEGACY: DatabaseAvailability = {status: 'legacy'};

export function useIsMetaDatabaseCandidate() {
    const database = useDatabaseFromQuery();
    const clusterName = useClusterNameFromQuery();
    const metaAvailable = useEmMetaAvailable();
    return Boolean(database && clusterName && window.api.meta && metaAvailable);
}

/**
 * Resolves whether the selected database is served by its runtime or only by the control plane.
 * Returns `legacy` when skipped or when the composite meta API is not used for the database.
 */
export function useDatabaseAvailability({skip = false}: {skip?: boolean} = {}) {
    const database = useDatabaseFromQuery() ?? '';
    const clusterName = useClusterNameFromQuery();
    const candidate = useIsMetaDatabaseCandidate();
    const active = candidate && !skip;

    const whoami = authenticationApi.useWhoamiQuery({database}, {skip: !active});
    const capabilities = capabilitiesApi.useGetClusterCapabilitiesQuery(
        {database},
        {skip: !active},
    );
    const {isResolved: clusterInfoResolved} = useClusterBaseInfo();
    const composite = useDatabasesV2();

    const tenantRequestReady = isTenantRequestReady({
        whoamiData: whoami.currentData,
        whoamiError: whoami.error,
        clusterInfoResolved,
    });
    const tenantRequested = active && composite && tenantRequestReady;
    const tenant = useTenantBaseInfo(database, clusterName, {skip: !tenantRequested});

    const availability = active
        ? getDatabaseAvailability({
              database,
              composite,
              whoamiData: whoami.currentData,
              whoamiError: whoami.error,
              capabilitiesError: capabilities.error,
              clusterInfoResolved,
              tenantData: tenant.databaseData,
              tenantError: tenant.error,
          })
        : LEGACY;

    const whoamiFailed = Boolean(whoami.error);
    const capabilitiesFailed = Boolean(capabilities.error);
    const {refetch: refetchWhoami} = whoami;
    const {refetch: refetchCapabilities} = capabilities;
    const {refetch: refetchTenant} = tenant;
    const retry = React.useCallback(() => {
        // A skipped query cannot be refetched; it starts by itself once whoami is resolved.
        if (tenantRequested) {
            refetchTenant();
        }
        // Successful requests are not repeated: refetching whoami shows a page-wide loader
        // in GetUser and would unmount the runtime page that is kept open.
        if (whoamiFailed) {
            refetchWhoami();
        }
        if (capabilitiesFailed) {
            refetchCapabilities();
        }
    }, [
        tenantRequested,
        whoamiFailed,
        capabilitiesFailed,
        refetchTenant,
        refetchWhoami,
        refetchCapabilities,
    ]);

    return {availability, retry};
}
