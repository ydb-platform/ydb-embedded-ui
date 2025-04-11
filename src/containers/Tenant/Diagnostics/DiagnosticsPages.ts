import React from 'react';

import {StringParam, useQueryParams} from 'use-query-params';

import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../store/reducers/tenant/constants';
import type {TenantDiagnosticsTab} from '../../../store/reducers/tenant/types';
import {EPathType} from '../../../types/api/schema';
import type {TenantQuery} from '../TenantPages';
import {TenantTabsGroups, getTenantPath} from '../TenantPages';
import {isDatabaseEntityType, isTopicEntityType} from '../utils/schema';

type Page = {
    id: TenantDiagnosticsTab;
    title: string;
};

const overview = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.overview,
    title: 'Info',
};

const schema = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.schema,
    title: 'Schema',
};

const topQueries = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.topQueries,
    title: 'Queries',
};

const topShards = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.topShards,
    title: 'Top shards',
};

const nodes = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.nodes,
    title: 'Nodes',
};

const tablets = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.tablets,
    title: 'Tablets',
};
const storage = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.storage,
    title: 'Storage',
};
const network = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.network,
    title: 'Network',
};

const describe = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.describe,
    title: 'Describe',
};

const hotKeys = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.hotKeys,
    title: 'Hot keys',
};

const graph = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.graph,
    title: 'Graph',
};

const consumers = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.consumers,
    title: 'Consumers',
};

const partitions = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.partitions,
    title: 'Partitions',
};
const topicData = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.topicData,
    title: 'Data',
};

const configs = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.configs,
    title: 'Configs',
};

const operations = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.operations,
    title: 'Operations',
};

const ASYNC_REPLICATION_PAGES = [overview, tablets, describe];

const TRANSFER_PAGES = [overview, tablets, describe];

const DATABASE_PAGES = [
    overview,
    topQueries,
    topShards,
    nodes,
    tablets,
    storage,
    network,
    describe,
    configs,
    operations,
];

const TABLE_PAGES = [overview, schema, topShards, nodes, graph, tablets, hotKeys, describe];
const COLUMN_TABLE_PAGES = [overview, schema, topShards, nodes, tablets, describe];

const DIR_PAGES = [overview, topShards, nodes, describe];

const CDC_STREAM_PAGES = [overview, consumers, partitions, nodes, tablets, describe];
const TOPIC_PAGES = [overview, consumers, partitions, topicData, nodes, tablets, describe];

const EXTERNAL_DATA_SOURCE_PAGES = [overview, describe];
const EXTERNAL_TABLE_PAGES = [overview, schema, describe];

const VIEW_PAGES = [overview, schema, describe];

// verbose mapping to guarantee correct tabs for new path types
// TS will error when a new type is added but not mapped here
const pathTypeToPages: Record<EPathType, Page[] | undefined> = {
    [EPathType.EPathTypeInvalid]: undefined,

    [EPathType.EPathTypeSubDomain]: DATABASE_PAGES,
    [EPathType.EPathTypeExtSubDomain]: DATABASE_PAGES,
    [EPathType.EPathTypeColumnStore]: DATABASE_PAGES,

    [EPathType.EPathTypeTable]: TABLE_PAGES,
    [EPathType.EPathTypeColumnTable]: COLUMN_TABLE_PAGES,

    [EPathType.EPathTypeDir]: DIR_PAGES,
    [EPathType.EPathTypeTableIndex]: DIR_PAGES,

    [EPathType.EPathTypeCdcStream]: CDC_STREAM_PAGES,

    [EPathType.EPathTypePersQueueGroup]: TOPIC_PAGES,

    [EPathType.EPathTypeExternalDataSource]: EXTERNAL_DATA_SOURCE_PAGES,
    [EPathType.EPathTypeExternalTable]: EXTERNAL_TABLE_PAGES,

    [EPathType.EPathTypeView]: VIEW_PAGES,

    [EPathType.EPathTypeReplication]: ASYNC_REPLICATION_PAGES,
    [EPathType.EPathTypeTransfer]: TRANSFER_PAGES,
    [EPathType.EPathTypeResourcePool]: DIR_PAGES,
};

export const getPagesByType = (
    type?: EPathType,
    options?: {hasFeatureFlags?: boolean; hasTopicData?: boolean; isTopLevel?: boolean},
) => {
    if (!type || !pathTypeToPages[type]) {
        return DIR_PAGES;
    }
    let pages = pathTypeToPages[type];
    if (isTopicEntityType(type) && !options?.hasTopicData) {
        return pages?.filter((item) => item.id !== TENANT_DIAGNOSTICS_TABS_IDS.topicData);
    }
    if (isDatabaseEntityType(type) || options?.isTopLevel) {
        pages = DATABASE_PAGES;
        if (!options?.hasFeatureFlags) {
            return pages.filter((item) => item.id !== TENANT_DIAGNOSTICS_TABS_IDS.configs);
        }
    }
    return pages;
};

export const useDiagnosticsPageLinkGetter = () => {
    const [queryParams] = useQueryParams({
        database: StringParam,
        schema: StringParam,
        backend: StringParam,
        clusterName: StringParam,
    });

    const getLink = React.useCallback(
        (tab: string, params?: TenantQuery) => {
            return getTenantPath({
                ...queryParams,
                [TenantTabsGroups.diagnosticsTab]: tab,
                ...params,
            });
        },
        [queryParams],
    );

    return getLink;
};
