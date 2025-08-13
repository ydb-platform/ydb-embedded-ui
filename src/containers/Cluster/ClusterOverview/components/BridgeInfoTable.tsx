import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';

import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import type {TBridgePile} from '../../../../types/api/cluster';
import {DEFAULT_TABLE_SETTINGS, EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {formatNumber} from '../../../../utils/dataFormatters/dataFormatters';
import i18n from '../../i18n';

interface BridgeInfoTableProps {
    piles: TBridgePile[];
    collapsed?: boolean;
}

export function BridgeInfoTable({piles}: BridgeInfoTableProps) {
    const columns = React.useMemo<Column<TBridgePile>[]>(
        () => [
            {
                name: 'Name',
                header: i18n('field_name'),
                width: 160,
                align: DataTable.LEFT,
            },
            {
                name: 'IsPrimary',
                header: i18n('field_primary'),
                width: 110,
                align: DataTable.LEFT,
                render: ({row}) => (row.IsPrimary ? i18n('value_yes') : i18n('value_no')),
            },
            {
                name: 'State',
                header: i18n('field_state'),
                width: 160,
                align: DataTable.LEFT,
            },
            {
                name: 'Nodes',
                header: i18n('field_nodes'),
                width: 100,
                align: DataTable.RIGHT,
                render: ({row}) =>
                    row.Nodes === undefined ? EMPTY_DATA_PLACEHOLDER : formatNumber(row.Nodes),
            },
        ],
        [],
    );

    return (
        <ResizeableDataTable<TBridgePile>
            columnsWidthLSKey="bridge-columns-width"
            data={piles}
            columns={columns}
            settings={{...DEFAULT_TABLE_SETTINGS, sortable: false}}
            rowKey={(row) => `${row.PileId ?? ''}|${row.Name ?? ''}`}
        />
    );
}
