import React from 'react';

import {TableWithControlsLayout} from '../TableWithControlsLayout/TableWithControlsLayout';

import {TableChunk} from './TableChunk';
import {TableHead} from './TableHead';
import {EmptyTableRow} from './TableRow';
import {DEFAULT_TABLE_ROW_HEIGHT} from './constants';
import i18n from './i18n';
import {b} from './shared';
import type {
    Column,
    FetchData,
    GetRowClassName,
    HandleTableColumnsResize,
    RenderControls,
    RenderEmptyDataMessage,
    RenderErrorMessage,
    SortParams,
} from './types';
import {useScrollBasedChunks} from './useScrollBasedChunks';

import './PaginatedTable.scss';

export interface PaginatedTableProps<T, F> {
    limit: number;
    initialEntitiesCount?: number;
    fetchData: FetchData<T, F>;
    filters?: F;
    tableName: string;
    columns: Column<T>[];
    getRowClassName?: GetRowClassName<T>;
    rowHeight?: number;
    parentRef: React.RefObject<HTMLElement>;
    initialSortParams?: SortParams;
    onColumnsResize?: HandleTableColumnsResize;
    renderControls?: RenderControls;
    renderEmptyDataMessage?: RenderEmptyDataMessage;
    renderErrorMessage?: RenderErrorMessage;
    containerClassName?: string;
}

export const PaginatedTable = <T, F>({
    limit: chunkSize,
    initialEntitiesCount,
    fetchData,
    filters,
    tableName,
    columns,
    getRowClassName,
    rowHeight = DEFAULT_TABLE_ROW_HEIGHT,
    parentRef,
    initialSortParams,
    onColumnsResize,
    renderControls,
    renderErrorMessage,
    renderEmptyDataMessage,
    containerClassName,
}: PaginatedTableProps<T, F>) => {
    const initialTotal = initialEntitiesCount || 0;
    const initialFound = initialEntitiesCount || 1;

    const [sortParams, setSortParams] = React.useState<SortParams | undefined>(initialSortParams);
    const [totalEntities, setTotalEntities] = React.useState(initialTotal);
    const [foundEntities, setFoundEntities] = React.useState(initialFound);
    const [isInitialLoad, setIsInitialLoad] = React.useState(true);

    const tableRef = React.useRef<HTMLDivElement>(null);

    const activeChunks = useScrollBasedChunks({
        parentRef,
        tableRef,
        totalItems: foundEntities,
        rowHeight,
        chunkSize,
    });

    const lastChunkSize = React.useMemo(
        () => foundEntities % chunkSize || chunkSize,
        [foundEntities, chunkSize],
    );

    const handleDataFetched = React.useCallback((total: number, found: number) => {
        setTotalEntities(total);
        setFoundEntities(found);
        setIsInitialLoad(false);
    }, []);

    // reset table on filters change
    React.useLayoutEffect(() => {
        setTotalEntities(initialTotal);
        setFoundEntities(initialFound);
        setIsInitialLoad(true);
        if (parentRef?.current) {
            parentRef.current.scrollTo(0, 0);
        }
    }, [filters, initialFound, initialTotal, parentRef]);

    const renderChunks = () => {
        if (!isInitialLoad && foundEntities === 0) {
            return (
                <tbody>
                    <EmptyTableRow columns={columns}>
                        {renderEmptyDataMessage ? renderEmptyDataMessage() : i18n('empty')}
                    </EmptyTableRow>
                </tbody>
            );
        }

        return activeChunks.map((isActive, index) => (
            <TableChunk<T, F>
                key={index}
                id={index}
                calculatedCount={index === activeChunks.length - 1 ? lastChunkSize : chunkSize}
                chunkSize={chunkSize}
                rowHeight={rowHeight}
                columns={columns}
                fetchData={fetchData}
                filters={filters}
                tableName={tableName}
                sortParams={sortParams}
                getRowClassName={getRowClassName}
                renderErrorMessage={renderErrorMessage}
                onDataFetched={handleDataFetched}
                isActive={isActive}
            />
        ));
    };

    const renderTable = () => (
        <table className={b('table')}>
            <TableHead columns={columns} onSort={setSortParams} onColumnsResize={onColumnsResize} />
            {renderChunks()}
        </table>
    );

    const renderContent = () => {
        if (renderControls) {
            return (
                <TableWithControlsLayout>
                    <TableWithControlsLayout.Controls>
                        {renderControls({inited: !isInitialLoad, totalEntities, foundEntities})}
                    </TableWithControlsLayout.Controls>
                    <TableWithControlsLayout.Table>{renderTable()}</TableWithControlsLayout.Table>
                </TableWithControlsLayout>
            );
        }

        return renderTable();
    };

    return (
        <div ref={tableRef} className={b(null, containerClassName)}>
            {renderContent()}
        </div>
    );
};
