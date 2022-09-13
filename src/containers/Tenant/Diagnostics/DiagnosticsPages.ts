import {EPathType} from "../../../types/api/schema";

export enum GeneralPagesIds {
    'overview' = 'Overview',
    'topQueries' = 'topQueries',
    'topShards' = 'topShards',
    'nodes' = 'Nodes',
    'tablets' = 'Tablets',
    'storage' = 'Storage',
    'network' = 'Network',
    'describe' = 'Describe',
    'hotKeys' = 'hotKeys',
    'graph' = 'graph',
}

type Page = {
    id: GeneralPagesIds,
    title: string,
};

const overview = {
    id: GeneralPagesIds.overview,
    title: 'Info',
};

const topQueries = {
    id: GeneralPagesIds.topQueries,
    title: 'Top queries',
};

const topShards = {
    id: GeneralPagesIds.topShards,
    title: 'Top shards',
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

export const TABLE_PAGES = [overview, topShards, graph, tablets, hotKeys, describe];

export const DIR_PAGES = [overview, topShards, describe];

export const TOPIC_PAGES = [overview, describe];

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
    
    [EPathType.EPathTypeCdcStream]: TOPIC_PAGES,
};

export const getPagesByType = (type?: EPathType) =>
    (type && pathTypeToPages[type]) || DIR_PAGES;
