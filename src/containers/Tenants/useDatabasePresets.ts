import React from 'react';

import {createSelector} from '@reduxjs/toolkit';

import {useGetMetaFeatureVersion} from '../../store/reducers/capabilities/hooks';
import {resourcePresetsApi} from '../../store/reducers/resourcePresets';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {backend, environment} from '../../store/runtimeParams';
import type {ResourcePreset} from '../../types/api/resourcePresets';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';

import {presetCatalogKey, requiredPreset} from './resourceUsage';

const endpoint = resourcePresetsApi.endpoints.listResourcePresets;

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
                    };
                },
            ),
        [queries],
    );

    return useTypedSelector(selectCatalogs);
}

/**
 * Resource presets the given databases are scaled by.
 * A database in a cloud is asked about with its cloud: the answer then also has the presets
 * restricted to that cloud. Other databases are asked about by the cluster alone.
 */
export function useDatabasePresets(rows: readonly PreparedTenant[]) {
    const available =
        useGetMetaFeatureVersion('/meta/list_resource_presets') >= 1 && Boolean(window.api.meta);
    const requests = React.useMemo(
        () => (available ? rows.map(requiredPreset).filter((preset) => preset !== undefined) : []),
        [available, rows],
    );

    return {available, ...usePresetCatalogs(requests)};
}
