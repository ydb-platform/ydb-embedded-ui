import type {TenantDiagnosticsTab} from '../../../store/reducers/tenant/types';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../store/reducers/tenant/constants';
import {EPathType} from '../../../types/api/schema';

type Page = {
    id: TenantDiagnosticsTab;
    title: string;
};

const overview = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.overview,
    title: 'Info',
};

const topQueries = {
    id: TENANT_DIAGNOSTICS_TABS_IDS.topQueries,
    title: 'Top queries',
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

export const DATABASE_PAGES = [
    overview,
    topQueries,
    topShards,
    nodes,
    tablets,
    storage,
    network,
    describe,
];

export const TABLE_PAGES = [overview, topShards, nodes, graph, tablets, hotKeys, describe];

export const DIR_PAGES = [overview, topShards, nodes, describe];

export const CDC_STREAM_PAGES = [overview, consumers, partitions, nodes, describe];
export const TOPIC_PAGES = [overview, consumers, partitions, nodes, describe];

// verbose mapping to guarantee correct tabs for new path types
// TS will error when a new type is added but not mapped here
const pathTypeToPages: Record<EPathType, Page[] | undefined> = {
    [EPathType.EPathTypeInvalid]: undefined,

    [EPathType.EPathTypeSubDomain]: DATABASE_PAGES,
    [EPathType.EPathTypeExtSubDomain]: DATABASE_PAGES,
    [EPathType.EPathTypeColumnStore]: DATABASE_PAGES,

    [EPathType.EPathTypeTable]: TABLE_PAGES,
    [EPathType.EPathTypeColumnTable]: TABLE_PAGES,

    [EPathType.EPathTypeDir]: DIR_PAGES,
    [EPathType.EPathTypeTableIndex]: DIR_PAGES,

    [EPathType.EPathTypeCdcStream]: CDC_STREAM_PAGES,

    [EPathType.EPathTypePersQueueGroup]: TOPIC_PAGES,
};

export const getPagesByType = (type?: EPathType) => (type && pathTypeToPages[type]) || DIR_PAGES;
