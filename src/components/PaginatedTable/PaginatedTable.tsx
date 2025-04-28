import React from 'react';

import {TableWithControlsLayout} from '../TableWithControlsLayout/TableWithControlsLayout';

import {TableChunk} from './TableChunk';
import {TableHead} from './TableHead';
import {DEFAULT_TABLE_ROW_HEIGHT} from './constants';
import {b} from './shared';
import type {
    Column,
    FetchData,
    GetRowClassName,
    HandleTableColumnsResize,
    PaginatedTableData,
    RenderControls,
    RenderEmptyDataMessage,
    RenderErrorMessage,
    SortParams,
} from './types';
import {useScrollBasedChunks} from './useScrollBasedChunks';

import './PaginatedTable.scss';

export interface PaginatedTableProps<T, F> {
    limit?: number;
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
    onDataFetched?: (data: PaginatedTableData<T>) => void;
}

const DEFAULT_PAGINATION_LIMIT = 20;

export const PaginatedTable = <T, F>({
    limit: chunkSize = DEFAULT_PAGINATION_LIMIT,
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
    onDataFetched,
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

    const lastChunkSize = React.useMemo(() => {
        // If foundEntities = 0, there will only first chunk
        // Display it with 1 row, to display empty data message
        if (!foundEntities) {
            return 1;
        }
        return foundEntities % chunkSize || chunkSize;
    }, [foundEntities, chunkSize]);

    const handleDataFetched = React.useCallback(
        (data?: PaginatedTableData<T>) => {
            if (data) {
                setTotalEntities(data.total);
                setFoundEntities(data.found);
                setIsInitialLoad(false);
                onDataFetched?.(data);
            }
        },
        [onDataFetched],
    );

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
                renderEmptyDataMessage={renderEmptyDataMessage}
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
