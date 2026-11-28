import React from 'react';

import {createSelector} from '@reduxjs/toolkit';

import {useGetMetaFeatureVersion} from '../../store/reducers/capabilities/hooks';
import {
    isTransientResourcePresetsError,
    resourcePresetsApi,
} from '../../store/reducers/resourcePresets';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {backend, environment} from '../../store/runtimeParams';
import type {ResourcePreset} from '../../types/api/resourcePresets';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';

import {presetCatalogKey, requiredPreset} from './resourceUsage';

const endpoint = resourcePresetsApi.endpoints.listResourcePresets;

/** Presets almost never change, but a cluster can be briefly unavailable. */
export const PRESETS_RETRY_DELAYS_MS = [1000, 3000];

interface CatalogRequest {
    clusterName: string;
    cloudId?: string;
}

function uniqueRequests(requests: CatalogRequest[]) {
    const byKey = new Map(
        requests.map(({clusterName, cloudId}) => [
            presetCatalogKey(clusterName, cloudId),
            {clusterName, cloudId},
        ]),
    );
    return Array.from(byKey.keys())
        .sort()
        .map((key) => byKey.get(key));
}

/**
 * Loaded catalogs by `presetCatalogKey`.
 * Each catalog is a query of its own: a slow or failed one does not hold the others.
 */
function usePresetCatalogs(requests: CatalogRequest[]) {
    const dispatch = useTypedDispatch();
    // The databases list is polled; the queries change only with the set of requests.
    const requestsKey = JSON.stringify(uniqueRequests(requests));
    const queries = React.useMemo(
        () =>
            (JSON.parse(requestsKey) as CatalogRequest[]).map((request) => ({
                ...request,
                environment,
                backend,
            })),
        [requestsKey],
    );

    React.useEffect(() => {
        const subscriptions = queries.map((query) => dispatch(endpoint.initiate(query)));
        return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
    }, [queries, dispatch]);

    const selectCatalogs = React.useMemo(
        () =>
            createSelector(
                queries.map((query) => endpoint.select(query)),
                (...results) => {
                    const catalogs = new Map<string, Map<string, ResourcePreset>>();
                    results.forEach(({data}, index) => {
                        if (data) {
                            const {clusterName, cloudId} = queries[index];
                            const presets = data.resource_presets?.map(
                                (preset) => [preset.id, preset] as const,
                            );
                            catalogs.set(presetCatalogKey(clusterName, cloudId), new Map(presets));
                        }
                    });
                    return {
                        catalogs,
                        loading: results.some(
                            ({data, isLoading, isUninitialized}) =>
                                !data && (isLoading || isUninitialized),
                        ),
                        /** Requests worth sending again */
                        failed: queries.flatMap((query, index) => {
                            const {isError, error, requestId} = results[index];
                            return isError && isTransientResourcePresetsError(error)
                                ? [{query, requestId}]
                                : [];
                        }),
                    };
                },
            ),
        [queries],
    );
    const {catalogs, loading, failed} = useTypedSelector(selectCatalogs);

    // A failed catalog is asked about again by the page that needs it, so that the retries
    // stop when the page is left and do not depend on other users of the same query.
    // The attempts are counted from the last request that was not a retry: the first load
    // and each Refresh get all of them.
    const [attempts, setAttempts] = React.useState<
        Record<string, {count: number; requestId: string}>
    >({});
    const retries = React.useMemo(
        () =>
            failed.flatMap(({query, requestId}) => {
                const key = presetCatalogKey(query.clusterName, query.cloudId);
                const last = attempts[key];
                const count = last && last.requestId === requestId ? last.count : 0;
                const delay = PRESETS_RETRY_DELAYS_MS[count];
                return delay === undefined ? [] : [{query, key, count, delay}];
            }),
        [failed, attempts],
    );
    React.useEffect(() => {
        const timers = retries.map(({query, key, count, delay}) =>
            setTimeout(() => {
                const {requestId} = dispatch(
                    endpoint.initiate(query, {subscribe: false, forceRefetch: true}),
                );
                setAttempts((current) => ({...current, [key]: {count: count + 1, requestId}}));
            }, delay),
        );
        return () => timers.forEach(clearTimeout);
    }, [retries, dispatch]);

    return {catalogs, loading: loading || retries.length > 0};
}

/** Resource presets the given databases are scaled by. */
export function useDatabasePresets(rows: readonly PreparedTenant[]) {
    const available =
        useGetMetaFeatureVersion('/meta/list_resource_presets') >= 1 && Boolean(window.api.meta);
    const required = React.useMemo(
        () => (available ? rows.map(requiredPreset).filter((preset) => preset !== undefined) : []),
        [available, rows],
    );

    const common = usePresetCatalogs(required.map(({clusterName}) => ({clusterName})));
    // A preset restricted to some clouds is listed only for them. Most presets are common,
    // so a cloud is asked about only when the catalog of its cluster lacks the preset.
    const restricted = usePresetCatalogs(
        required.filter(({clusterName, cloudId, presetId}) => {
            const catalog = common.catalogs.get(presetCatalogKey(clusterName));
            return cloudId && catalog && !catalog.has(presetId);
        }),
    );

    const catalogs = React.useMemo(
        () => new Map([...common.catalogs, ...restricted.catalogs]),
        [common.catalogs, restricted.catalogs],
    );

    return {available, catalogs, loading: common.loading || restricted.loading};
}
