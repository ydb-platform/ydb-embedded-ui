import React from 'react';

import {EntitiesCount} from '../../../components/EntitiesCount';
import {ResponseError} from '../../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../../components/ResizeableDataTable/ResizeableDataTable';
import {TableColumnSetup} from '../../../components/TableColumnSetup/TableColumnSetup';
import {TableWithControlsLayout} from '../../../components/TableWithControlsLayout/TableWithControlsLayout';
import {NODES_COLUMNS_TITLES} from '../../../components/nodesColumns/constants';
import {DEFAULT_TABLE_SETTINGS} from '../../../lib';
import {nodeApi} from '../../../store/reducers/node/node';
import {useSelectedColumns} from '../../../utils/hooks/useSelectedColumns';

import {getNodeNetworkColumns} from './columns';
import {
    NODE_NETWORK_DEFAULT_COLUMNS,
    NODE_NETWORK_REQUIRED_COLUMNS,
    NODE_NETWORK_TABLE_SELECTED_COLUMNS_KEY,
} from './constants';
import i18n from './i18n';
import {mapPeerToNodeNetworkRow} from './nodeNetworkMapper';

interface NodeNetworkProps {
    nodeId: string;
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
    className?: string;
}

const NETWORK_COLUMNS_WIDTH_LS_KEY = 'networkTableColumnsWidth';

export function NodeNetwork({nodeId, scrollContainerRef, className}: NodeNetworkProps) {
    const {data, isLoading, error} = nodeApi.useGetNodePeersQuery({nodeId});

    const preparedPeersData = React.useMemo(
        () => (data?.Peers ?? []).map(mapPeerToNodeNetworkRow),
        [data],
    );

    const allColumns = React.useMemo(
        () => getNodeNetworkColumns({database: data?.Peers?.[0]?.SystemState?.Tenants?.[0]}),
        [data],
    );

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        allColumns,
        NODE_NETWORK_TABLE_SELECTED_COLUMNS_KEY,
        NODES_COLUMNS_TITLES,
        NODE_NETWORK_DEFAULT_COLUMNS,
        NODE_NETWORK_REQUIRED_COLUMNS,
    );

    const totalPeers = data?.FoundPeers;

    return (
        <TableWithControlsLayout fullHeight className={className}>
            <TableWithControlsLayout.Controls>
                <TableColumnSetup
                    items={columnsToSelect}
                    onUpdate={setColumns}
                    popupWidth={220}
                    showStatus
                />
                <EntitiesCount
                    total={totalPeers}
                    current={preparedPeersData.length}
                    label={'Peers'}
                    loading={isLoading}
                />
            </TableWithControlsLayout.Controls>
            <TableWithControlsLayout.Table
                scrollContainerRef={scrollContainerRef}
                loading={isLoading}
            >
                {error ? (
                    <ResponseError error={error} />
                ) : (
                    <ResizeableDataTable
                        columnsWidthLSKey={NETWORK_COLUMNS_WIDTH_LS_KEY}
                        data={preparedPeersData}
                        columns={columnsToShow}
                        settings={DEFAULT_TABLE_SETTINGS}
                        emptyDataMessage={i18n('alert_no-network-data')}
                        isLoading={isLoading}
                    />
                )}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}
