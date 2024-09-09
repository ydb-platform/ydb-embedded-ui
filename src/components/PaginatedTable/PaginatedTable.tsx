import React from 'react';

import {getArray} from '../../utils';
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

import './PaginatedTable.scss';

export interface PaginatedTableProps<T, F> {
    limit: number;
    fetchData: FetchData<T, F>;
    filters?: F;
    tableName: string;
    columns: Column<T>[];
    getRowClassName?: GetRowClassName<T>;
    rowHeight?: number;
    parentContainer?: Element | null;
    initialSortParams?: SortParams;
    onColumnsResize?: HandleTableColumnsResize;
    renderControls?: RenderControls;
    renderEmptyDataMessage?: RenderEmptyDataMessage;
    renderErrorMessage?: RenderErrorMessage;
    containerClassName?: string;
}

export const PaginatedTable = <T, F>({
    limit,
    fetchData,
    filters,
    tableName,
    columns,
    getRowClassName,
    rowHeight = DEFAULT_TABLE_ROW_HEIGHT,
    parentContainer,
    initialSortParams,
    onColumnsResize,
    renderControls,
    renderErrorMessage,
    renderEmptyDataMessage,
    containerClassName,
}: PaginatedTableProps<T, F>) => {
    const [sortParams, setSortParams] = React.useState<SortParams | undefined>(initialSortParams);
    const [totalEntities, setTotalEntities] = React.useState(limit);
    const [foundEntities, setFoundEntities] = React.useState(0);
    const [activeChunks, setActiveChunks] = React.useState<number[]>([]);
    const [isInitialLoad, setIsInitialLoad] = React.useState(true);

    const tableContainer = React.useRef<HTMLDivElement>(null);
    const observerRef = React.useRef<IntersectionObserver | null>(null);

    const handleDataFetched = React.useCallback((total: number, found: number) => {
        setTotalEntities(total);
        setFoundEntities(found);
        setIsInitialLoad(false);
    }, []);

    const updateActiveChunks = React.useCallback((entries: IntersectionObserverEntry[]) => {
        setActiveChunks((prev) => {
            const newActiveChunks = new Set(prev);

            entries.forEach((entry) => {
                const chunkId = Number(entry.target.id);
                if (entry.isIntersecting) {
                    newActiveChunks.add(chunkId);
                } else {
                    newActiveChunks.delete(chunkId);
                }
            });

            return Array.from(newActiveChunks);
        });
    }, []);

    React.useLayoutEffect(() => {
        if (tableContainer.current) {
            observerRef.current = new IntersectionObserver(updateActiveChunks);

            const chunkElements = tableContainer.current.querySelectorAll('tbody[id]');
            chunkElements.forEach((el) => observerRef.current?.observe(el));
        }

        return () => {
            observerRef.current?.disconnect();
        };
    }, [parentContainer, updateActiveChunks, foundEntities, limit]);

    React.useEffect(() => {
        setTotalEntities(limit);
        setFoundEntities(0);
        setIsInitialLoad(true);
        if (parentContainer) {
            parentContainer.scrollTo(0, 0);
        } else {
            tableContainer.current?.scrollTo(0, 0);
        }

        setActiveChunks([0]);
    }, [filters, limit, parentContainer]);

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

        const totalLength = foundEntities || limit;
        const chunksCount = Math.ceil(totalLength / limit);

        return getArray(chunksCount).map((value) => (
            <TableChunk<T, F>
                key={value}
                id={value}
                limit={limit}
                rowHeight={rowHeight}
                columns={columns}
                fetchData={fetchData}
                filters={filters}
                tableName={tableName}
                sortParams={sortParams}
                getRowClassName={getRowClassName}
                renderErrorMessage={renderErrorMessage}
                onDataFetched={handleDataFetched}
                isActive={activeChunks.includes(value)}
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
        <div ref={tableContainer} className={b(null, containerClassName)}>
            {renderContent()}
        </div>
    );
};
