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

const overview = {
    id: GeneralPagesIds.overview,
    title: 'Overview',
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

export const getPagesByType = (type?: EPathType) => {
    switch (type) {
        case EPathType.EPathTypeColumnStore:
        case EPathType.EPathTypeSubDomain:
            return DATABASE_PAGES;
        case EPathType.EPathTypeColumnTable:
        case EPathType.EPathTypeTable:
            return TABLE_PAGES;
        case EPathType.EPathTypeDir:
        case EPathType.EPathTypeTableIndex:
        default:
            return DIR_PAGES;
    }
}
