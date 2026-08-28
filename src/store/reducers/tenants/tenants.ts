import type {TTenantInfo} from '../../../types/api/tenant';
import {api} from '../api';

import type {PreparedTenant} from './types';
import {prepareTenants} from './utils';

export const tenantsApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTenantsInfo: build.query({
            queryFn: async (
                {
                    clusterName,
                    environmentName,
                    isMetaDatabasesAvailable,
                }: {
                    clusterName?: string;
                    environmentName?: string;
                    isMetaDatabasesAvailable?: boolean;
                },
                {signal},
            ) => {
                try {
                    let response: TTenantInfo;

                    if (isMetaDatabasesAvailable && window.api.meta) {
                        response = await window.api.meta.getTenantsV2(
                            {clusterName, environmentName},
                            {signal},
                        );
                    } else if (window.api.meta) {
                        response = await window.api.meta.getTenants({clusterName}, {signal});
                    } else {
                        response = await window.api.viewer.getTenants({clusterName}, {signal});
                    }
                    let data: PreparedTenant[];
                    if (Array.isArray(response.TenantInfo)) {
                        data = prepareTenants(response.TenantInfo);
                    } else {
                        data = [];
                    }
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            serializeQueryArgs: ({queryArgs}) => {
                const {clusterName, environmentName} = queryArgs;
                return {clusterName, environmentName};
            },
            providesTags: ['All'],
        }),
        getSharedDatabaseName: build.query<
            string | null,
            {
                backend?: string;
                clusterName?: string;
                database?: string;
                environmentName?: string;
                isMonitoringAllowed: boolean;
                resourceId: string;
            }
        >({
            queryFn: async ({clusterName, database, isMonitoringAllowed, resourceId}, {signal}) => {
                if (isMonitoringAllowed && database) {
                    try {
                        const data = await window.api.viewer.getTabletDescribe(
                            {PathId: resourceId},
                            database,
                            {signal},
                        );
                        const sharedDatabaseName = data?.Path?.trim();

                        if (sharedDatabaseName) {
                            return {data: sharedDatabaseName};
                        }
                    } catch (error) {
                        if (signal.aborted) {
                            return {error};
                        }
                    }
                }

                try {
                    const response = await window.api.viewer.getTenants(
                        {clusterName, metadataCache: false, storage: false},
                        {signal},
                    );
                    const sharedDatabaseName = response.TenantInfo?.find(
                        ({Id}) => Id === resourceId,
                    )?.Name?.trim();

                    return {data: sharedDatabaseName || null};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
