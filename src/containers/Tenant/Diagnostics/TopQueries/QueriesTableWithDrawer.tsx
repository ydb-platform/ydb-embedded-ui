import React from 'react';

import type {Column, Settings, SortOrder} from '@gravity-ui/react-data-table';
import {isEqual} from 'lodash';

import {DrawerWrapper} from '../../../../components/Drawer';
import type {DrawerControl} from '../../../../components/Drawer/Drawer';
import {ResizeableDataTable} from '../../../../components/ResizeableDataTable/ResizeableDataTable';
import type {KeyValueRow} from '../../../../types/api/query';
import {cn} from '../../../../utils/cn';

import {QueryDetailsDrawerContent} from './QueryDetails/QueryDetailsDrawerContent';
import i18n from './i18n';
import {TOP_QUERIES_TABLE_SETTINGS} from './utils';

const b = cn('kv-top-queries');

interface SimpleTableWithDrawerProps {
    columns: Column<KeyValueRow>[];
    data: KeyValueRow[];
    loading?: boolean;
    onRowClick?: (
        row: KeyValueRow | null,
        index?: number,
        event?: React.MouseEvent<HTMLTableRowElement>,
    ) => void;
    columnsWidthLSKey?: string;
    emptyDataMessage?: string;
    sortOrder?: SortOrder | SortOrder[];
    onSort?: (sortOrder: SortOrder | SortOrder[] | undefined) => void;
    selectedRow?: KeyValueRow | null | undefined;
    onSelectedRowChange?: (row: KeyValueRow | null | undefined) => void;
    drawerControls?: DrawerControl[];
    drawerId?: string;
    storageKey?: string;
    tableSettings?: Settings;
}

export function QueriesTableWithDrawer({
    columns,
    data,
    loading,
    onRowClick,
    columnsWidthLSKey,
    emptyDataMessage,
    sortOrder,
    onSort,
    selectedRow: externalSelectedRow,
    onSelectedRowChange,
    drawerControls,
    drawerId = 'query-details',
    storageKey = 'kv-top-queries-drawer-width',
    tableSettings = TOP_QUERIES_TABLE_SETTINGS,
}: SimpleTableWithDrawerProps) {
    const [internalSelectedRow, setInternalSelectedRow] = React.useState<
        KeyValueRow | null | undefined
    >(undefined);

    const selectedRow =
        externalSelectedRow === undefined ? internalSelectedRow : externalSelectedRow;
    const setSelectedRow = onSelectedRowChange || setInternalSelectedRow;

    const handleCloseDetails = React.useCallback(() => {
        setSelectedRow(undefined);
    }, [setSelectedRow]);

    const isDrawerVisible = selectedRow !== undefined;

    const handleRowClick = React.useCallback(
        (
            row: KeyValueRow | null,
            index?: number,
            event?: React.MouseEvent<HTMLTableRowElement>,
        ) => {
            event?.stopPropagation();
            setSelectedRow(row);
            onRowClick?.(row, index, event);
        },
        [onRowClick, setSelectedRow],
    );

    const renderDrawerContent = React.useCallback(
        () => <QueryDetailsDrawerContent row={selectedRow} onClose={handleCloseDetails} />,
        [selectedRow, handleCloseDetails],
    );

    const defaultDrawerControls: DrawerControl[] = React.useMemo(() => [{type: 'close'}], []);
    const finalDrawerControls = drawerControls || defaultDrawerControls;

    return (
        <DrawerWrapper
            isDrawerVisible={isDrawerVisible}
            onCloseDrawer={handleCloseDetails}
            renderDrawerContent={renderDrawerContent}
            drawerId={drawerId}
            storageKey={storageKey}
            detectClickOutside
            isPercentageWidth
            title={i18n('query-details.title')}
            drawerControls={finalDrawerControls}
        >
            <ResizeableDataTable
                emptyDataMessage={emptyDataMessage || i18n('no-data')}
                columnsWidthLSKey={columnsWidthLSKey}
                columns={columns}
                data={data}
                loading={loading}
                settings={tableSettings}
                onRowClick={handleRowClick}
                rowClassName={(row) => b('row', {active: isEqual(row, selectedRow)})}
                sortOrder={sortOrder}
                onSort={onSort}
            />
        </DrawerWrapper>
    );
}
