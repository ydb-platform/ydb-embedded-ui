import React from 'react';

import {useRowVirtualizer} from '@gravity-ui/table';
import type {SortingState} from '@gravity-ui/table/tanstack';

import {tableDataApi} from '../../store/reducers/tableData';
import type {IResponseError} from '../../types/api/error';
import type {FetchData} from '../PaginatedTable/types';

import {ASCENDING, DEFAULT_VIRTUALIZATION_OVERSCAN, DESCENDING} from './constants';
import {ChunkState, TableActionType, tableReducer} from './tableReducer';
import type {SortParams, UseTableDataProps, UseTableDataResult} from './types';

const DEFAULT_CHUNK_SIZE = 50;
const TABLE_PADDINGS = 14;

interface UseTableDataPropsWithSorting<T, F> extends UseTableDataProps<T, F> {
    sorting?: SortingState;
}

function convertSortingToSortParams(sorting?: SortingState): SortParams | undefined {
    if (!sorting?.[0]) {
        return undefined;
    }
    return {
        columnId: sorting[0].id,
        sortOrder: sorting[0].desc ? DESCENDING : ASCENDING,
    };
}

export function useTableData<T, F>({
    fetchData,
    filters,
    tableName,
    columns,
    chunkSize = DEFAULT_CHUNK_SIZE,
    autoRefreshInterval,
    initialEntitiesCount = 0,
    rowHeight,
    containerRef,
    sorting,
}: UseTableDataPropsWithSorting<T, F>): UseTableDataResult<T> {
    const initialChunksCount = Math.ceil((initialEntitiesCount || 0) / chunkSize);
    const [state, dispatch] = React.useReducer(tableReducer<T>, {
        rows: [],
        foundEntities: initialEntitiesCount || 0,
        totalEntities: initialEntitiesCount || 0,
        chunkStates: new Array(initialChunksCount).fill(undefined),
    });

    const rowVirtualizer = useRowVirtualizer({
        count: state.foundEntities,
        estimateSize: () => rowHeight + TABLE_PADDINGS,
        overscan: DEFAULT_VIRTUALIZATION_OVERSCAN,
        getScrollElement: () => containerRef.current,
        useScrollendEvent: true,
    });

    const startChunk = Math.floor((rowVirtualizer.range?.startIndex ?? 0) / chunkSize);
    const endChunk = Math.floor((rowVirtualizer.range?.endIndex ?? 0) / chunkSize);

    const [error, setError] = React.useState<IResponseError>();
    const [fetchTableChunk, {isLoading}] = tableDataApi.useLazyFetchTableChunkQuery({
        pollingInterval: autoRefreshInterval,
    });

    React.useEffect(() => {
        setError(undefined); // Reset error when dependencies change
        async function fetchChunksData() {
            for (let currentChunk = startChunk; currentChunk <= endChunk; currentChunk++) {
                // Skip if chunk is already loaded or loading
                if (
                    state.chunkStates[currentChunk] === ChunkState.LOADED ||
                    state.chunkStates[currentChunk] === ChunkState.LOADING
                ) {
                    continue;
                }

                const offset = currentChunk * chunkSize;
                const queryParams = {
                    fetchData: fetchData as FetchData<unknown, unknown>,
                    filters,
                    columnsIds: columns.map((col) => col.name),
                    tableName,
                    offset,
                    limit: chunkSize,
                    sortParams: convertSortingToSortParams(sorting),
                };

                // Mark chunk as loading
                dispatch({
                    type: TableActionType.UPDATE_CHUNK_STATE,
                    payload: {
                        chunkIndex: currentChunk,
                        state: ChunkState.LOADING,
                    },
                });

                try {
                    const {data, found, total} = await fetchTableChunk(queryParams).unwrap();
                    dispatch({
                        type: TableActionType.UPDATE_DATA,
                        payload: {
                            data: data as T[],
                            found,
                            total,
                            offset,
                            chunkSize,
                        },
                    });
                } catch (e) {
                    console.error('Failed to fetch chunk data:', e);
                    setError(e as IResponseError);
                    // Reset chunk state on error
                    dispatch({
                        type: TableActionType.UPDATE_CHUNK_STATE,
                        payload: {
                            chunkIndex: currentChunk,
                            state: undefined,
                        },
                    });
                }
            }
        }

        fetchChunksData();
    }, [
        fetchTableChunk,
        fetchData,
        filters,
        columns,
        tableName,
        chunkSize,
        startChunk,
        endChunk,
        sorting,
        state.chunkStates,
    ]);

    return {
        data: state.rows.filter((row: T | undefined): row is T => row !== undefined),
        isLoading,
        error: error as IResponseError | undefined,
        totalEntities: state.totalEntities,
        foundEntities: state.foundEntities,
        rowVirtualizer,
        rows: state.rows,
    };
}
