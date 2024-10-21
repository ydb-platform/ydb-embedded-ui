import React from 'react';

import {tableDataApi} from '../../store/reducers/tableData';
import type {IResponseError} from '../../types/api/error';
import {getArray} from '../../utils';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {ResponseError} from '../Errors/ResponseError';

import {EmptyTableRow, LoadingTableRow, TableRow} from './TableRow';
import type {Column, FetchData, GetRowClassName, SortParams} from './types';

const DEBOUNCE_TIMEOUT = 200;

interface TableChunkProps<T, F> {
    id: number;
    limit: number;
    totalLength: number;
    rowHeight: number;
    columns: Column<T>[];
    filters?: F;
    sortParams?: SortParams;
    isActive: boolean;
    tableName: string;

    fetchData: FetchData<T, F>;
    getRowClassName?: GetRowClassName<T>;
    renderErrorMessage?: (error: IResponseError) => React.ReactNode;
    onDataFetched: (total: number, found: number) => void;
}

// Memoisation prevents chunks rerenders that could cause perfomance issues on big tables
export const TableChunk = <T, F>({
    id,
    limit,
    totalLength,
    rowHeight,
    columns,
    fetchData,
    tableName,
    filters,
    sortParams,
    getRowClassName,
    renderErrorMessage,
    onDataFetched,
    isActive,
}: TableChunkProps<T, F>) => {
    const [isTimeoutActive, setIsTimeoutActive] = React.useState(true);
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const columnsIds = columns.map((column) => column.name).sort();

    const queryParams = {
        offset: id * limit,
        limit,
        fetchData: fetchData as FetchData<T, unknown>,
        filters,
        sortParams,
        columnsIds,
        tableName,
    };

    tableDataApi.useFetchTableChunkQuery(queryParams, {
        skip: isTimeoutActive || !isActive,
        pollingInterval: autoRefreshInterval,
    });

    const {currentData, error} = tableDataApi.endpoints.fetchTableChunk.useQueryState(queryParams);

    React.useEffect(() => {
        let timeout = 0;

        if (isActive && isTimeoutActive) {
            timeout = window.setTimeout(() => {
                setIsTimeoutActive(false);
            }, DEBOUNCE_TIMEOUT);
        }

        return () => {
            window.clearTimeout(timeout);
        };
    }, [isActive, isTimeoutActive]);

    React.useEffect(() => {
        if (currentData && isActive) {
            const {total = 0, found = 0} = currentData;
            onDataFetched(total, found);
        }
    }, [currentData, isActive, onDataFetched]);

    const chunkOffset = id * limit;
    const remainingLength = totalLength - chunkOffset;
    const calculatedChunkLength = remainingLength < limit ? remainingLength : limit;

    const dataLength = currentData?.data?.length || calculatedChunkLength;

    const renderContent = () => {
        if (!isActive) {
            return null;
        }

        if (!currentData) {
            if (error) {
                const errorData = error as IResponseError;
                return (
                    <EmptyTableRow columns={columns}>
                        {renderErrorMessage ? (
                            renderErrorMessage(errorData)
                        ) : (
                            <ResponseError error={errorData} />
                        )}
                    </EmptyTableRow>
                );
            } else {
                return getArray(dataLength).map((value) => (
                    <LoadingTableRow
                        key={value}
                        columns={columns}
                        height={rowHeight}
                        index={value}
                    />
                ));
            }
        }

        return currentData.data.map((rowData, index) => (
            <TableRow
                key={index}
                index={index}
                row={rowData as T}
                columns={columns}
                height={rowHeight}
                getRowClassName={getRowClassName}
            />
        ));
    };

    const chunkHeight = dataLength ? dataLength * rowHeight : limit * rowHeight;

    return (
        <tbody
            id={id.toString()}
            style={{
                height: `${chunkHeight}px`,
                // Default display: table-row-group doesn't work in Safari and breaks the table
                // display: block works in Safari, but disconnects thead and tbody cell grids
                // Hack to make it work in all cases
                display: isActive ? 'table-row-group' : 'block',
            }}
        >
            {renderContent()}
        </tbody>
    );
};
