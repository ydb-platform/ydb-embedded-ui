import type {ListResourcePresetsResponse} from '../../types/api/resourcePresets';
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

/** Presets of a cluster almost never change, but a cluster can be briefly unavailable. */
export const RESOURCE_PRESETS_RETRY_DELAYS_MS = [1000, 3000];

function isTransientError(error: unknown) {
    // A response blocked by CORS keeps its status and still reads as a network error
    if (isResponseError(error) && typeof error.status === 'number') {
        return !error.isCancelled && error.status >= 500;
    }
    return isNetworkError(error);
}

function wait(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export const resourcePresetsApi = api.injectEndpoints({
    endpoints: (build) => ({
        listResourcePresets: build.query<ListResourcePresetsResponse, ResourcePresetsParams>({
            queryFn: async ({clusterName, cloudId}, {signal}) => {
                const {meta} = window.api;
                if (!meta) {
                    return {error: {message: 'Meta API is not available.'}};
                }
                for (let attempt = 0; ; attempt++) {
                    try {
                        const data = await meta.listResourcePresets(
                            {clusterName, cloudId},
                            {signal},
                        );
                        return {data};
                    } catch (error) {
                        const delay = RESOURCE_PRESETS_RETRY_DELAYS_MS[attempt];
                        if (delay === undefined || signal.aborted || !isTransientError(error)) {
                            return {error};
                        }
                        await wait(delay);
                    }
                }
            },
            // The Refresh button retries the clusters that still failed.
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
