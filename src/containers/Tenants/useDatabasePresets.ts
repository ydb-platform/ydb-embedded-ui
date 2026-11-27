import React from 'react';

import {useGetMetaFeatureVersion} from '../../store/reducers/capabilities/hooks';
import {resourcePresetsApi} from '../../store/reducers/resourcePresets';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {backend, environment} from '../../store/runtimeParams';
import type {ResourcePreset} from '../../types/api/resourcePresets';

import {needsPreset} from './resourceUsage';

function getClusters(rows: readonly PreparedTenant[]) {
    const clusters = new Set<string>();
    for (const row of rows) {
        if (row.Cluster && needsPreset(row)) {
            clusters.add(row.Cluster);
        }
    }
    return Array.from(clusters).sort();
}

/** Resource presets of every cluster the given databases need them from. */
export function useDatabasePresets(rows: readonly PreparedTenant[]) {
    const available =
        useGetMetaFeatureVersion('/meta/list_resource_presets') >= 1 && Boolean(window.api.meta);
    const clusterNames = React.useMemo(() => getClusters(rows), [rows]);
    // `data` outlives a change of the clusters list, so known presets stay while new ones load.
    const {data, isLoading} = resourcePresetsApi.useListClustersResourcePresetsQuery(
        {clusterNames, environment, backend},
        {skip: !available || !clusterNames.length},
    );
    const catalogs = React.useMemo(() => {
        const result = new Map<string, Map<string, ResourcePreset>>();
        for (const [clusterName, presets] of Object.entries(data ?? {})) {
            result.set(clusterName, new Map(presets.map((preset) => [preset.id, preset])));
        }
        return result;
    }, [data]);

    return {available, catalogs, loading: isLoading};
}
