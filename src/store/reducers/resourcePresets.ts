import type {ListResourcePresetsResponse} from '../../types/api/resourcePresets';
import {backend, environment} from '../runtimeParams';

import {api} from './api';

interface ResourcePresetsParams {
    clusterName: string;
    environmentName?: string;
    environment?: string;
    backend?: string;
}

export const resourcePresetsApi = api.injectEndpoints({
    endpoints: (build) => ({
        listResourcePresets: build.query<ListResourcePresetsResponse, ResourcePresetsParams>({
            queryFn: async (params, {signal}) => {
                try {
                    if (!window.api.meta) {
                        return {error: {message: 'Meta API is not available.'}};
                    }
                    const data = await window.api.meta.listResourcePresets(params, {signal});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});

export function useClusterResourcePresets(clusterName: string) {
    return resourcePresetsApi.useListResourcePresetsQuery(
        {clusterName, environment, backend},
        {skip: !clusterName},
    );
}
