import type {ListResourcePresetsResponse, ResourcePreset} from '../../types/api/resourcePresets';
import {isNetworkError, isResponseError} from '../../utils/response';
import {backend, environment} from '../runtimeParams';

import {api} from './api';

interface ResourcePresetsParams {
    clusterName: string;
    /** Adds the presets restricted to this cloud to the common ones. */
    cloudId?: string;
    environment?: string;
    backend?: string;
}

/** A catalog is a handful of presets; the limit only stops a token that never ends. */
const MAX_PAGES = 100;

/** A cluster can be briefly unavailable: such a failure is worth asking again. */
export function isTransientResourcePresetsError(error: unknown) {
    // A response blocked by CORS keeps its status and still reads as a network error
    if (isResponseError(error) && typeof error.status === 'number') {
        return !error.isCancelled && error.status >= 500;
    }
    return isNetworkError(error);
}

export const resourcePresetsApi = api.injectEndpoints({
    endpoints: (build) => ({
        listResourcePresets: build.query<ListResourcePresetsResponse, ResourcePresetsParams>({
            queryFn: async ({clusterName, cloudId}, {signal}) => {
                const {meta} = window.api;
                if (!meta) {
                    return {error: {message: 'Meta API is not available.'}};
                }
                try {
                    const presets: ResourcePreset[] = [];
                    let pageToken: string | undefined;
                    for (let page = 0; page < MAX_PAGES; page++) {
                        const response = await meta.listResourcePresets(
                            {clusterName, cloudId, pageToken},
                            {signal},
                        );
                        presets.push(...(response.resource_presets ?? []));
                        pageToken = response.next_page_token || undefined;
                        if (!pageToken) {
                            break;
                        }
                    }
                    return {data: {resource_presets: presets}};
                } catch (error) {
                    return {error};
                }
            },
            // The Refresh button asks again about the catalogs that failed.
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});

export function useClusterResourcePresets(clusterName: string, cloudId?: string) {
    return resourcePresetsApi.useListResourcePresetsQuery(
        {clusterName, cloudId, environment, backend},
        {skip: !clusterName},
    );
}
