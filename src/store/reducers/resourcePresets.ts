import type {ListResourcePresetsResponse, ResourcePreset} from '../../types/api/resourcePresets';
import {backend, environment} from '../runtimeParams';

import {api} from './api';

interface RuntimeScope {
    environment?: string;
    backend?: string;
}

interface ResourcePresetsParams extends RuntimeScope {
    clusterName: string;
}

interface ClustersResourcePresetsParams extends RuntimeScope {
    clusterNames: string[];
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
        /** Presets by cluster name. A cluster whose request failed is absent from the result. */
        listClustersResourcePresets: build.query<
            Record<string, ResourcePreset[]>,
            ClustersResourcePresetsParams
        >({
            queryFn: async ({clusterNames}, {signal}) => {
                const {meta} = window.api;
                if (!meta) {
                    return {error: {message: 'Meta API is not available.'}};
                }
                const results = await Promise.allSettled(
                    clusterNames.map((clusterName) =>
                        meta.listResourcePresets({clusterName}, {signal}),
                    ),
                );
                const data: Record<string, ResourcePreset[]> = {};
                results.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        data[clusterNames[index]] = result.value.resource_presets ?? [];
                    }
                });
                const failed = results.find((result) => result.status === 'rejected');
                if (failed && !Object.keys(data).length) {
                    return {error: failed.reason};
                }
                return {data};
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
