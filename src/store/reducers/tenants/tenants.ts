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
    }),
    overrideExisting: 'throw',
});
