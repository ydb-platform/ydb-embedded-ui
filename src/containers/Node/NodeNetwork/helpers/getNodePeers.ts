import {isNil} from 'lodash';

import type {FetchData} from '../../../../components/PaginatedTable';
import type {TPeersResponse} from '../../../../types/api/peers';
import {prepareSortValue} from '../../../../utils/filters';
import {isNumeric} from '../../../../utils/utils';
import {getNodeNetworkColumnSortField} from '../constants';

import {mapPeerToNodeNetworkRow} from './nodeNetworkMapper';
import type {NodePeerRow} from './nodeNetworkMapper';

export interface NodePeersFilters {
    nodeId: string | number;
    searchValue?: string;
}

export const getNodePeers: FetchData<NodePeerRow, NodePeersFilters> = async (params) => {
    const {limit, offset, filters, sortParams} = params;

    const {sortOrder, columnId} = sortParams ?? {};

    if (isNil(filters?.nodeId)) {
        return {data: [], found: 0, total: 0};
    }

    const {nodeId, searchValue} = filters;

    const sortField = getNodeNetworkColumnSortField(columnId);
    const sort = sortField ? prepareSortValue(sortField, sortOrder) : undefined;

    const response: TPeersResponse = await window.api.viewer.getNodePeers({
        nodeId,
        filter: searchValue,
        limit,
        offset,
        sort,
    });

    const peers = response.Peers ?? [];
    const data: NodePeerRow[] = peers.map(mapPeerToNodeNetworkRow);

    return {
        data,
        found: isNumeric(response.FoundPeers) ? Number(response.FoundPeers) : 0,
        total: isNumeric(response.TotalPeers) ? Number(response.TotalPeers) : 0,
    };
};
