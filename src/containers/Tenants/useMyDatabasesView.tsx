import React from 'react';

import {Select} from '@gravity-ui/uikit';
import {createEnumParam, useQueryParams} from 'use-query-params';

import {CloudFilter} from './CloudFilter';
import {ClusterFilter} from './ClusterFilter';
import {ResourceGroupFilter} from './ResourceGroupFilter';
import {databaseCloudId} from './clouds';
import {MY_DATABASE_TYPES} from './constants';
import {ENVIRONMENT_FILTERS_PARAMS} from './environmentFilters';
import i18n from './i18n';
import {RESOURCE_GROUPINGS, allocatedResources, groupByResourceUsage} from './resourceUsage';
import type {DatabaseRow} from './types';
import {useDatabasePresets} from './useDatabasePresets';

const EMPTY_ROWS: DatabaseRow[] = [];

const databaseTypeOptions = MY_DATABASE_TYPES.map((type) => ({value: type, content: type}));

const queryParamsConfig = {
    ...ENVIRONMENT_FILTERS_PARAMS,
    databaseType: createEnumParam<string>(MY_DATABASE_TYPES),
    groupBy: createEnumParam([...RESOURCE_GROUPINGS]),
};

export function isMyDatabase({Type}: DatabaseRow) {
    return MY_DATABASE_TYPES.some((type) => type === Type);
}

interface MyDatabasesViewParams {
    /** The cluster databases table has none of this: it only gets its rows filtered. */
    enabled: boolean;
    /** All databases of the page. */
    tenants: DatabaseRow[];
    /** The filters shared with the cluster databases table. */
    filterRows: (rows: DatabaseRow[]) => DatabaseRow[];
    environmentName?: string;
}

/** Filters, allocated resources and grouping that exist only on My databases. */
export function useMyDatabasesView({
    enabled,
    tenants,
    filterRows,
    environmentName,
}: MyDatabasesViewParams) {
    const [{databaseType, cluster: clusters, cloudId: cloudIds, groupBy}, setQueryParams] =
        useQueryParams(queryParamsConfig);

    const hasControlPlane =
        enabled && tenants.some((row) => row.ControlPlane && Object.keys(row.ControlPlane).length);
    const presets = useDatabasePresets(hasControlPlane ? tenants : EMPTY_ROWS);
    const withAllocatedResources = hasControlPlane && presets.available;
    // Allocated resources are set before filtering: a row stays the same object while filters change.
    const {catalogs} = presets;
    const databases = React.useMemo(
        () =>
            withAllocatedResources
                ? tenants.map((row) => ({...row, allocated: allocatedResources(row, catalogs)}))
                : tenants,
        [withAllocatedResources, tenants, catalogs],
    );

    const availableCloudIds = React.useMemo(() => {
        const ids = new Set<string>();
        if (enabled) {
            for (const row of tenants) {
                const id = databaseCloudId(row);
                if (id) {
                    ids.add(id);
                }
            }
        }
        return Array.from(ids).sort();
    }, [enabled, tenants]);
    const hasCloudIds = availableCloudIds.length > 0;

    const rows = React.useMemo(() => {
        const filtered = filterRows(databases);
        if (!enabled) {
            return filtered;
        }
        const selectedClusters = new Set(clusters);
        const selectedClouds = new Set(hasCloudIds ? cloudIds : []);
        return filtered.filter(
            (row) =>
                (!databaseType || row.Type === databaseType) &&
                (!selectedClusters.size || selectedClusters.has(row.Cluster ?? '')) &&
                (!selectedClouds.size || selectedClouds.has(databaseCloudId(row) ?? '')),
        );
    }, [enabled, filterRows, databases, databaseType, clusters, cloudIds, hasCloudIds]);

    const mode = (withAllocatedResources && groupBy) || undefined;
    const groups = React.useMemo(
        () => (mode ? groupByResourceUsage(rows, mode) : undefined),
        [rows, mode],
    );

    const controls = enabled ? (
        <React.Fragment>
            <Select
                label={`${i18n('column-type')}:`}
                aria-label={i18n('column-type')}
                placeholder={i18n('value_all')}
                width={200}
                hasClear
                options={databaseTypeOptions}
                value={databaseType ? [databaseType] : []}
                onUpdate={([value]) => setQueryParams({databaseType: value}, 'replaceIn')}
            />
            <ClusterFilter
                rows={tenants}
                value={clusters}
                onChange={(values) => setQueryParams({cluster: values}, 'replaceIn')}
            />
            {hasCloudIds && (
                <CloudFilter
                    ids={availableCloudIds}
                    environmentName={environmentName}
                    value={cloudIds}
                    onChange={(values) => setQueryParams({cloudId: values}, 'replaceIn')}
                />
            )}
            {withAllocatedResources && (
                <ResourceGroupFilter
                    mode={mode}
                    onChange={(value) => setQueryParams({groupBy: value}, 'replaceIn')}
                    loading={presets.loading}
                />
            )}
        </React.Fragment>
    ) : null;

    return {
        rows,
        groups,
        controls,
        /** Control Plane data is present and the backend can tell what its presets mean. */
        withAllocatedResources,
        /** Everything here that changes the set or the order of the rendered rows. */
        filters: [mode, databaseType, clusters, cloudIds],
    };
}
