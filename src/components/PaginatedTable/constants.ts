export const LEFT = 'left';
export const CENTER = 'center';
export const RIGHT = 'right';

export const DEFAULT_ALIGN = LEFT;
export const DEFAULT_RESIZEABLE = true;

export const ASCENDING = 1;
export const DESCENDING = -1;

export const DEFAULT_SORT_ORDER = DESCENDING;

// Time in ms after which request will be sent
export const DEFAULT_REQUEST_TIMEOUT = 200;

export const DEFAULT_TABLE_ROW_HEIGHT = 41;

export const DEFAULT_INTERSECTION_OBSERVER_MARGIN = '100%';

export const PAGINATED_TABLE_IDS = {
    NODES: 'nodes',
    STORAGE_NODES: 'storage-nodes',
    STORAGE_GROUPS: 'storage-groups',
    TOPIC_DATA: 'topic-data',
    NODE_PEERS: 'node-peers',
} as const;

export type PaginatedTableId = (typeof PAGINATED_TABLE_IDS)[keyof typeof PAGINATED_TABLE_IDS];

export const PAGINATED_TABLE_COLUMN_IDS_IN_REQUEST: Record<PaginatedTableId, boolean> = {
    [PAGINATED_TABLE_IDS.NODES]: true,
    [PAGINATED_TABLE_IDS.STORAGE_NODES]: true,
    [PAGINATED_TABLE_IDS.STORAGE_GROUPS]: true,
    [PAGINATED_TABLE_IDS.TOPIC_DATA]: true,
    [PAGINATED_TABLE_IDS.NODE_PEERS]: false,
};

export function shouldSendColumnIds(tableId: PaginatedTableId): boolean {
    return PAGINATED_TABLE_COLUMN_IDS_IN_REQUEST[tableId] ?? false;
}
