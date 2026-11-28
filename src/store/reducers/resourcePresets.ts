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

const INCOMPLETE_CATALOG_ERROR = {
    message: 'The resource presets catalog was not read to the end: its pages do not stop.',
};

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
                    const readTokens = new Set<string | undefined>();
                    let pageToken: string | undefined;
                    do {
                        // A part of a catalog would look like a catalog without some presets
                        if (readTokens.has(pageToken) || readTokens.size === MAX_PAGES) {
                            return {error: INCOMPLETE_CATALOG_ERROR};
                        }
                        readTokens.add(pageToken);
                        const response = await meta.listResourcePresets(
                            {clusterName, cloudId, pageToken},
                            {signal},
                        );
                        presets.push(...(response.resource_presets ?? []));
                        pageToken = response.next_page_token || undefined;
                    } while (pageToken);
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
