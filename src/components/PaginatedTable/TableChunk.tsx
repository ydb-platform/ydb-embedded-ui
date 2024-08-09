import React from 'react';

import {tableDataApi} from '../../store/reducers/tableData';
import type {IResponseError} from '../../types/api/error';
import {getArray} from '../../utils';
import {useDelayed} from '../../utils/hooks/useDelayed';
import {ResponseError} from '../Errors/ResponseError';

import {EmptyTableRow, LoadingTableRow, TableRow} from './TableRow';
import type {Column, FetchData, GetRowClassName, PaginatedTableData, SortParams} from './types';

const DEBOUNCE_TIMEOUT = 200;

interface TableChunkDataLoaderProps<T, F> {
    id: number;
    chunkSize: number;
    sortParams?: SortParams;
    filters?: F;

    fetchData: FetchData<T, F>;
    onDataStateChange: (data?: PaginatedTableData<T>) => void;
    onErrorStateChange: (error?: unknown) => void;
    onLoadingStateChange: (isLoading: boolean) => void;
}

const TableChunkDataLoader = <T, F>({
    id,
    chunkSize,
    sortParams,
    fetchData,
    filters,
    onDataStateChange,
    onErrorStateChange,
    onLoadingStateChange,
}: TableChunkDataLoaderProps<T, F>) => {
    const isTimeoutPassed = useDelayed(DEBOUNCE_TIMEOUT);

    // query is not refetched on fetchData change
    // because functions are not used in query cache key
    // so filters are used explicitly
    const {data, error, isFetching} = tableDataApi.useFetchTableChunkQuery(
        {
            id,
            chunkSize,
            fetchData: fetchData as FetchData<T, unknown>,
            filters,
            sortParams,
        },
        {skip: !isTimeoutPassed, refetchOnMountOrArgChange: true},
    );

    React.useEffect(() => {
        if (data) {
            onDataStateChange(data as PaginatedTableData<T>);
            onErrorStateChange(undefined);
        } else if (error) {
            onDataStateChange(undefined);
            onErrorStateChange(error);
        }
    }, [data, error, onDataStateChange, onErrorStateChange]);

    React.useEffect(() => {
        if (!isTimeoutPassed || isFetching) {
            onLoadingStateChange(true);
        } else {
            onLoadingStateChange(false);
        }
    }, [isFetching, isTimeoutPassed, onLoadingStateChange]);

    return null;
};

interface TableChunkProps<T, F> {
    id: number;
    chunkSize: number;
    rowHeight: number;
    columns: Column<T>[];
    filters?: F;
    sortParams?: SortParams;
    observer: IntersectionObserver;
    isActive: boolean;

    fetchData: FetchData<T, F>;
    getRowClassName?: GetRowClassName<T>;
    renderErrorMessage?: (error: IResponseError) => React.ReactNode;
    onDataFetched: (id: number, total: number, found: number) => void;
}

export const TableChunk = <T, F>({
    id,
    chunkSize,
    rowHeight,
    columns,
    fetchData,
    filters,
    sortParams,
    observer,
    getRowClassName,
    renderErrorMessage,
    onDataFetched,
    isActive,
}: TableChunkProps<T, F>) => {
    const ref = React.useRef<HTMLTableSectionElement>(null);
    const [data, setData] = React.useState<PaginatedTableData<T>>();
    const [error, setError] = React.useState<unknown>();
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        const el = ref.current;
        if (el) {
            observer.observe(el);
        }
        return () => {
            if (el) {
                observer.unobserve(el);
            }
        };
    }, [observer]);

    React.useEffect(() => {
        if (data && isActive) {
            const {total = 0, found = 0} = data;
            onDataFetched(id, total, found);
        }
    }, [data, id, isActive, onDataFetched]);

    const renderContent = () => {
        if (!isActive) {
            return null;
        }

        if (isLoading) {
            return getArray((data?.data || []).length || chunkSize).map((value) => (
                <LoadingTableRow key={value} columns={columns} height={rowHeight} index={value} />
            ));
        }

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
        }

        return ((data?.data || []) as T[]).map((rowData, index) => (
            <TableRow
                key={index}
                index={index}
                row={rowData}
                columns={columns}
                height={rowHeight}
                getRowClassName={getRowClassName}
            />
        ));
    };

    const dataLength = data?.data?.length;
    const chunkHeight = dataLength ? dataLength * rowHeight : chunkSize * rowHeight;

    return (
        <tbody ref={ref} id={id.toString()} style={{height: `${chunkHeight}px`}}>
            {renderContent()}
            {isActive ? (
                <TableChunkDataLoader<T, F>
                    id={id}
                    chunkSize={chunkSize}
                    sortParams={sortParams}
                    fetchData={fetchData}
                    onDataStateChange={setData}
                    onErrorStateChange={setError}
                    onLoadingStateChange={setIsLoading}
                    filters={filters}
                />
            ) : null}
        </tbody>
    );
};
