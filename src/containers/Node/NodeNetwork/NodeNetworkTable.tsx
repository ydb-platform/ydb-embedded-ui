import React from 'react';

import {ResizeablePaginatedTable} from '../../../components/PaginatedTable';
import type {PaginatedTableData} from '../../../components/PaginatedTable';
import {renderPaginatedTableErrorMessage} from '../../../utils/renderPaginatedTableErrorMessage';
import type {Column} from '../../../utils/tableUtils/types';

import {NODE_NETWORK_COLUMNS_WIDTH_LS_KEY} from './constants';
import {getNodePeers} from './helpers/getNodePeers';
import type {NodePeerRow} from './helpers/nodeNetworkMapper';
import i18n from './i18n';

interface NodeNetworkTableProps {
    nodeId: string;
    searchValue: string;
    columns: Column<NodePeerRow>[];
    scrollContainerRef: React.RefObject<HTMLElement>;
    onDataFetched?: (data: PaginatedTableData<NodePeerRow>) => void;
}

export function NodeNetworkTable({
    nodeId,
    searchValue,
    columns,
    scrollContainerRef,
    onDataFetched,
}: NodeNetworkTableProps) {
    const filters = React.useMemo(
        () => ({
            nodeId,
            searchValue: searchValue || undefined,
        }),
        [nodeId, searchValue],
    );

    const renderEmptyDataMessage = React.useCallback(() => i18n('alert_no-network-data'), []);

    return (
        <ResizeablePaginatedTable
            columnsWidthLSKey={NODE_NETWORK_COLUMNS_WIDTH_LS_KEY}
            scrollContainerRef={scrollContainerRef}
            columns={columns}
            fetchData={getNodePeers}
            filters={filters}
            tableName="node-peers"
            renderErrorMessage={renderPaginatedTableErrorMessage}
            renderEmptyDataMessage={renderEmptyDataMessage}
            onDataFetched={onDataFetched}
        />
    );
}
