import React from 'react';

import {createSelector, lruMemoize} from '@reduxjs/toolkit';
import {shallowEqual} from 'react-redux';

import {useGetMetaFeatureVersion} from '../../store/reducers/capabilities/hooks';
import {resourcePresetsApi} from '../../store/reducers/resourcePresets';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {backend, environment} from '../../store/runtimeParams';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';

import {needsPreset} from './resourceUsage';

const endpoint = resourcePresetsApi.endpoints.listResourcePresets;

function getClusters(rows: readonly PreparedTenant[], available: boolean) {
    const clusters = new Set<string>();
    if (available) {
        for (const row of rows) {
            if (row.Cluster && needsPreset(row)) {
                clusters.add(row.Cluster);
            }
        }
    }
    return Array.from(clusters).sort();
}

export function useDatabasePresets(rows: readonly PreparedTenant[], environmentName?: string) {
    const dispatch = useTypedDispatch();
    const version = useGetMetaFeatureVersion('/meta/list_resource_presets');
    const selectClusters = React.useMemo(
        () => lruMemoize(getClusters, {resultEqualityCheck: shallowEqual}),
        [],
    );
    const clusters = selectClusters(rows, Boolean(window.api.meta) && version >= 1);
    const currentEnvironment = environment;
    const currentBackend = backend;
    const queries = React.useMemo(
        () =>
            clusters.map((clusterName) => ({
                clusterName,
                environmentName,
                environment: currentEnvironment,
                backend: currentBackend,
            })),
        [clusters, environmentName, currentEnvironment, currentBackend],
    );

    React.useEffect(() => {
        const subscriptions = queries.map((params) => dispatch(endpoint.initiate(params)));
        return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
    }, [queries, dispatch]);

    const selectPresets = React.useMemo(
        () =>
            createSelector(
                queries.map((params) => endpoint.select(params)),
                (...results) => ({
                    catalogs: new Map(
                        results.map((result, index) => [
                            queries[index].clusterName,
                            new Map(
                                result.data?.resource_presets?.map((preset) => [preset.id, preset]),
                            ),
                        ]),
                    ),
                    loading: results.some(
                        (result) => !result.data && (result.isLoading || result.isUninitialized),
                    ),
                }),
            ),
        [queries],
    );
    return useTypedSelector(selectPresets);
}
