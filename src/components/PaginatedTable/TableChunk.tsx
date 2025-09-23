import React from 'react';

import {tableDataApi} from '../../store/reducers/tableData';
import type {IResponseError} from '../../types/api/error';
import {getArray} from '../../utils';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {ResponseError} from '../Errors/ResponseError';

import {usePaginatedTableState} from './PaginatedTableContext';
import {EmptyTableRow, LoadingTableRow, TableRow} from './TableRow';
import i18n from './i18n';
import type {
    Column,
    FetchData,
    GetRowClassName,
    PaginatedTableData,
    RenderEmptyDataMessage,
    RenderErrorMessage,
    SortParams,
} from './types';
import {typedMemo} from './utils';

const DEBOUNCE_TIMEOUT = 200;

interface TableChunkProps<T, F> {
    id: number;
    chunkSize: number;
    rowHeight: number;
    calculatedCount: number;
    columns: Column<T>[];
    filters?: F;
    sortParams?: SortParams;
    shouldFetch: boolean;
    shouldRender: boolean;
    tableName: string;

    fetchData: FetchData<T, F>;
    getRowClassName?: GetRowClassName<T>;
    renderErrorMessage?: RenderErrorMessage;
    renderEmptyDataMessage?: RenderEmptyDataMessage;
    onDataFetched: (data?: PaginatedTableData<T>) => void;

    keepCache?: boolean;
}

// Memoisation prevents chunks rerenders that could cause perfomance issues on big tables
export const TableChunk = typedMemo(function TableChunk<T, F>({
    id,
    chunkSize,
    calculatedCount,
    rowHeight,
    columns,
    fetchData,
    tableName,
    filters,
    sortParams,
    getRowClassName,
    renderErrorMessage,
    renderEmptyDataMessage,
    onDataFetched,
    shouldFetch,
    shouldRender,
    keepCache,
}: TableChunkProps<T, F>) {
    const [isTimeoutActive, setIsTimeoutActive] = React.useState(true);
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {noBatching} = usePaginatedTableState();

    //sort ids to prevent refetch if only order was changed
    const columnsIds = columns.map((column) => column.name).toSorted();

    const queryParams = {
        offset: id * chunkSize,
        limit: chunkSize,
        fetchData: fetchData as FetchData<T, unknown>,
        filters,
        sortParams,
        columnsIds,
        tableName,
        noBatching,
    };

    tableDataApi.useFetchTableChunkQuery(queryParams, {
        skip: isTimeoutActive || !shouldFetch,
        pollingInterval: autoRefreshInterval,
        refetchOnMountOrArgChange: !keepCache,
    });

    const {currentData, error} = tableDataApi.endpoints.fetchTableChunk.useQueryState(queryParams);

    React.useEffect(() => {
        let timeout = 0;

        if (shouldFetch && isTimeoutActive) {
            timeout = window.setTimeout(() => {
                setIsTimeoutActive(false);
            }, DEBOUNCE_TIMEOUT);
        }

        return () => {
            window.clearTimeout(timeout);
        };
    }, [shouldFetch, isTimeoutActive]);

    React.useEffect(() => {
        if (currentData) {
            onDataFetched({
                ...currentData,
                data: currentData.data as T[],
                found: currentData.found || 0,
                total: currentData.total || 0,
            });
        }
    }, [currentData, onDataFetched]);

    const dataLength = currentData?.data?.length || calculatedCount;

    const renderContent = () => {
        if (!currentData) {
            if (error) {
                const errorData = error as IResponseError;
                return (
                    <EmptyTableRow columns={columns} height={dataLength * rowHeight}>
                        {renderErrorMessage ? (
                            renderErrorMessage(errorData)
                        ) : (
                            <ResponseError error={errorData} />
                        )}
                    </EmptyTableRow>
                );
            } else {
                return getArray(dataLength).map((value) => (
                    <LoadingTableRow key={value} columns={columns} height={rowHeight} />
                ));
            }
        }

        // Data is loaded, but there are no entities in the chunk
        if (!currentData.data?.length) {
            return (
                <EmptyTableRow columns={columns} height={dataLength * rowHeight}>
                    {renderEmptyDataMessage ? renderEmptyDataMessage() : i18n('empty')}
                </EmptyTableRow>
            );
        }

        return currentData.data.map((rowData, index) => (
            <TableRow
                key={index}
                row={rowData as T}
                columns={columns}
                height={rowHeight}
                getRowClassName={getRowClassName}
            />
        ));
    };

    return shouldRender ? renderContent() : null;
});
