import React from 'react';

import {Select} from '@gravity-ui/uikit';
import type {QueryParamConfig} from 'use-query-params';
import {ArrayParam, createEnumParam, useQueryParams} from 'use-query-params';

import {CloudFilter} from './CloudFilter';
import {ClusterFilter} from './ClusterFilter';
import {ResourceGroupFilter} from './ResourceGroupFilter';
import {databaseCloudId} from './clouds';
import {MY_DATABASE_TYPES} from './constants';
import i18n from './i18n';
import {RESOURCE_GROUPINGS, allocatedResources, groupByResourceUsage} from './resourceUsage';
import type {DatabaseRow} from './types';
import {useDatabasePresets} from './useDatabasePresets';

const EMPTY_ROWS: DatabaseRow[] = [];

const databaseTypeOptions = MY_DATABASE_TYPES.map((type) => ({value: type, content: type}));

const filterValuesParam: QueryParamConfig<string[]> = {
    encode: (values) => ArrayParam.encode(values.length ? values : undefined),
    decode(input) {
        return Array.from(
            new Set(ArrayParam.decode(input)?.filter((value): value is string => Boolean(value))),
        );
    },
};

const queryParamsConfig = {
    databaseType: createEnumParam<string>(MY_DATABASE_TYPES),
    cluster: filterValuesParam,
    cloudId: filterValuesParam,
    groupBy: createEnumParam([...RESOURCE_GROUPINGS]),
};

export function isMyDatabase({Type}: DatabaseRow) {
    return MY_DATABASE_TYPES.some((type) => type === Type);
}

interface MyDatabasesViewParams {
    /** The cluster databases table has none of this: it gets the rows back unchanged. */
    enabled: boolean;
    /** All databases of the page, the source of filter options. */
    tenants: DatabaseRow[];
    /** Databases left after the filters shared with the cluster databases table. */
    rows: DatabaseRow[];
    environmentName?: string;
}

/** Filters, allocated resources and grouping that exist only on My databases. */
export function useMyDatabasesView({
    enabled,
    tenants,
    rows,
    environmentName,
}: MyDatabasesViewParams) {
    const [{databaseType, cluster: clusters, cloudId: cloudIds, groupBy}, setQueryParams] =
        useQueryParams(queryParamsConfig);

    const hasControlPlane =
        enabled && tenants.some((row) => row.ControlPlane && Object.keys(row.ControlPlane).length);
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

    const filteredRows = React.useMemo(() => {
        if (!enabled) {
            return rows;
        }
        const selectedClusters = new Set(clusters);
        const selectedClouds = new Set(hasCloudIds ? cloudIds : []);
        return rows.filter(
            (row) =>
                (!databaseType || row.Type === databaseType) &&
                (!selectedClusters.size || selectedClusters.has(row.Cluster ?? '')) &&
                (!selectedClouds.size || selectedClouds.has(databaseCloudId(row) ?? '')),
        );
    }, [enabled, rows, databaseType, clusters, cloudIds, hasCloudIds]);

    const {catalogs, loading: loadingPresets} = useDatabasePresets(
        hasControlPlane ? filteredRows : EMPTY_ROWS,
        environmentName,
    );
    const viewRows = React.useMemo(
        () =>
            hasControlPlane
                ? filteredRows.map((row) => ({
                      ...row,
                      allocated: allocatedResources(row, catalogs),
                  }))
                : filteredRows,
        [hasControlPlane, filteredRows, catalogs],
    );

    const mode = (hasControlPlane && groupBy) || undefined;
    const groups = React.useMemo(
        () => (mode ? groupByResourceUsage(viewRows, mode) : undefined),
        [viewRows, mode],
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
            {hasControlPlane && (
                <ResourceGroupFilter
                    mode={mode}
                    onChange={(value) => setQueryParams({groupBy: value}, 'replaceIn')}
                    loading={loadingPresets}
                />
            )}
        </React.Fragment>
    ) : null;

    return {
        rows: viewRows,
        groups,
        controls,
        hasControlPlane,
        /** Everything here that changes the set or the order of the rendered rows. */
        filters: [mode, databaseType, clusters, cloudIds],
    };
}
