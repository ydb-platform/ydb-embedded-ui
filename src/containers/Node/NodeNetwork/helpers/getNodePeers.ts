import type {FetchData} from '../../../../components/PaginatedTable';
import type {BackendSortParam} from '../../../../types/api/common';
import type {PeersSortValue, TPeersResponse} from '../../../../types/api/peers';
import {prepareSortValue} from '../../../../utils/filters';

import {mapPeerToNodeNetworkRow} from './nodeNetworkMapper';
import type {NodePeerRow} from './nodeNetworkMapper';

const NODE_NETWORK_COLUMNS_TO_SORT_FIELDS: Record<string, PeersSortValue | undefined> = {
    NodeId: 'PeerId',
    Host: 'PeerName',
    NodeName: 'PeerName',
    PileName: 'PileName',
    Skew: 'ClockSkew',
    Ping: 'PingTime',
    SentBytes: 'BytesSend',
    ReceivedBytes: 'BytesReceived',
};

function getPeersColumnSortField(columnId?: string): PeersSortValue | undefined {
    if (!columnId) {
        return undefined;
    }

    return NODE_NETWORK_COLUMNS_TO_SORT_FIELDS[columnId];
}

export interface NodePeersFilters {
    nodeId: string;
    searchValue?: string;
}

export const getNodePeers: FetchData<NodePeerRow, NodePeersFilters> = async ({
    limit,
    offset,
    filters,
    sortParams,
    signal,
}) => {
    const nodeId = filters.nodeId;
    const searchValue = filters?.searchValue;

    const {sortOrder, columnId} = sortParams ?? {};
    const sortField = getPeersColumnSortField(columnId);
    const sort: BackendSortParam<PeersSortValue> | undefined = sortField
        ? prepareSortValue(sortField, sortOrder)
        : undefined;

    const response: TPeersResponse = await window.api.viewer.getNodePeers(
        {
            nodeId,
            filter: searchValue,
            limit,
            offset,
            sort,
        },
        {signal},
    );

    const peers = response.Peers ?? [];
    const data: NodePeerRow[] = peers.map(mapPeerToNodeNetworkRow);

    const found = response.FoundPeers !== undefined ? Number(response.FoundPeers) : peers.length;

    const total = response.TotalPeers !== undefined ? Number(response.TotalPeers) : found;

    return {
        data,
        found,
        total,
    };
};
