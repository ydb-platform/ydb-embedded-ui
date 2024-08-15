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
import {useIntersectionObserver} from './useIntersectionObserver';

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
}: PaginatedTableProps<T, F>) => {
    const [sortParams, setSortParams] = React.useState<SortParams | undefined>(initialSortParams);
    const [totalEntities, setTotalEntities] = React.useState(limit);
    const [foundEntities, setFoundEntities] = React.useState(0);
    const [activeChunks, setActiveChunks] = React.useState<number[]>([]);
    const [isInitialLoad, setIsInitialLoad] = React.useState(true);

    const tableContainer = React.useRef<HTMLDivElement>(null);

    const handleDataFetched = React.useCallback((total: number, found: number) => {
        setTotalEntities(total);
        setFoundEntities(found);
        setIsInitialLoad(false);
    }, []);

    const onEntry = React.useCallback((id: string) => {
        setActiveChunks((prev) => [...new Set([...prev, Number(id)])]);
    }, []);

    const onLeave = React.useCallback((id: string) => {
        setActiveChunks((prev) => prev.filter((chunk) => chunk !== Number(id)));
    }, []);

    const observer = useIntersectionObserver({onEntry, onLeave, parentContainer});

    // reset table on filters change
    React.useLayoutEffect(() => {
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
        if (!observer) {
            return null;
        }

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
                observer={observer}
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
        <div ref={tableContainer} className={b(null)}>
            {renderContent()}
        </div>
    );
};
