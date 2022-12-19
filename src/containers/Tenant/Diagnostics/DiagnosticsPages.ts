import {EPathType} from '../../../types/api/schema';

export enum GeneralPagesIds {
    'overview' = 'Overview',
    'topQueries' = 'topQueries',
    'overloadedShards' = 'overloadedShards',
    'nodes' = 'Nodes',
    'tablets' = 'Tablets',
    'storage' = 'Storage',
    'network' = 'Network',
    'describe' = 'Describe',
    'hotKeys' = 'hotKeys',
    'graph' = 'graph',
    'consumers' = 'consumers',
}

type Page = {
    id: GeneralPagesIds;
    title: string;
};

const overview = {
    id: GeneralPagesIds.overview,
    title: 'Info',
};

const topQueries = {
    id: GeneralPagesIds.topQueries,
    title: 'Top queries',
};

const overloadedShards = {
    id: GeneralPagesIds.overloadedShards,
    title: 'Overloaded shards',
};

const nodes = {
    id: GeneralPagesIds.nodes,
    title: 'Nodes',
};

const tablets = {
    id: GeneralPagesIds.tablets,
    title: 'Tablets',
};
const storage = {
    id: GeneralPagesIds.storage,
    title: 'Storage',
};
const network = {
    id: GeneralPagesIds.network,
    title: 'Network',
};

const describe = {
    id: GeneralPagesIds.describe,
    title: 'Describe',
};

const hotKeys = {
    id: GeneralPagesIds.hotKeys,
    title: 'Hot keys',
};

const graph = {
    id: GeneralPagesIds.graph,
    title: 'Graph',
};

const consumers = {
    id: GeneralPagesIds.consumers,
    title: 'Consumers',
};

export const DATABASE_PAGES = [
    overview,
    topQueries,
    overloadedShards,
    nodes,
    tablets,
    storage,
    network,
    describe,
];

export const TABLE_PAGES = [overview, overloadedShards, graph, tablets, hotKeys, describe];

export const DIR_PAGES = [overview, overloadedShards, describe];

export const CDC_STREAM_PAGES = [overview, consumers, describe];
export const TOPIC_PAGES = [overview, consumers, describe];

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
