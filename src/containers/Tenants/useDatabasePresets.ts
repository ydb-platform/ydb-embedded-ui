import React from 'react';

import {createSelector} from '@reduxjs/toolkit';

import {useGetMetaFeatureVersion} from '../../store/reducers/capabilities/hooks';
import {resourcePresetsApi} from '../../store/reducers/resourcePresets';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {backend, environment} from '../../store/runtimeParams';
import type {ResourcePreset} from '../../types/api/resourcePresets';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';

import {needsPreset} from './resourceUsage';

const endpoint = resourcePresetsApi.endpoints.listResourcePresets;

function getClusters(rows: readonly PreparedTenant[]) {
    const clusters = new Set<string>();
    for (const row of rows) {
        if (row.Cluster && needsPreset(row)) {
            clusters.add(row.Cluster);
        }
    }
    return Array.from(clusters).sort();
}

/**
 * Resource presets of every cluster the given databases need them from.
 * Each cluster is a query of its own: a slow or failed cluster does not hold the others.
 */
export function useDatabasePresets(rows: readonly PreparedTenant[]) {
    const dispatch = useTypedDispatch();
    const available =
        useGetMetaFeatureVersion('/meta/list_resource_presets') >= 1 && Boolean(window.api.meta);
    // The databases list is polled; the queries change only with the set of clusters.
    const clustersKey = React.useMemo(
        () => JSON.stringify(available ? getClusters(rows) : []),
        [available, rows],
    );
    const queries = React.useMemo(
        () =>
            (JSON.parse(clustersKey) as string[]).map((clusterName) => ({
                clusterName,
                environment,
                backend,
            })),
        [clustersKey],
    );

    React.useEffect(() => {
        const subscriptions = queries.map((query) => dispatch(endpoint.initiate(query)));
        return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
    }, [queries, dispatch]);

    const selectPresets = React.useMemo(
        () =>
            createSelector(
                queries.map((query) => endpoint.select(query)),
                (...results) => {
                    const catalogs = new Map<string, Map<string, ResourcePreset>>();
                    results.forEach(({data}, index) => {
                        const presets = data?.resource_presets?.map(
                            (preset) => [preset.id, preset] as const,
                        );
                        catalogs.set(queries[index].clusterName, new Map(presets));
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

    return {available, ...useTypedSelector(selectPresets)};
}
