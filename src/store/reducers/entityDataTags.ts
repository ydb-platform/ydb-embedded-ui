export const DATABASE_DATA_TAG = 'DatabaseData';
export const CLUSTER_DATA_TAG = 'ClusterData';

const ENTITY_DATA_LIST_TAG_ID = 'LIST';
const DEFAULT_CLUSTER_DATA_TAG_ID = '__default_cluster__';

export const DATABASE_DATA_LIST_TAG = {
    type: DATABASE_DATA_TAG,
    id: ENTITY_DATA_LIST_TAG_ID,
} as const;

export const CLUSTER_DATA_LIST_TAG = {
    type: CLUSTER_DATA_TAG,
    id: ENTITY_DATA_LIST_TAG_ID,
} as const;

export function getDatabaseDataTag({
    clusterName,
    database,
}: {
    clusterName?: string;
    database: string;
}) {
    return {
        type: DATABASE_DATA_TAG,
        id: JSON.stringify([clusterName ?? null, database]),
    } as const;
}

export function getClusterDataTag(clusterName?: string) {
    return {
        type: CLUSTER_DATA_TAG,
        id: clusterName ?? DEFAULT_CLUSTER_DATA_TAG_ID,
    } as const;
}
