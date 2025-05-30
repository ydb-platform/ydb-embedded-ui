import type {BaseQueryFn, EndpointBuilder} from '@reduxjs/toolkit/query';

import type {FetchData, PaginatedTableData, SortParams} from '../../components/PaginatedTable';
import {requestBatcher} from '../../components/PaginatedTable/requestBatcher';

import {api} from './api';

interface PaginatedTableParams<T, F> {
    offset: number;
    fetchData: FetchData<T, F>;
    filters: F;
    limit: number;
    sortParams?: SortParams;
    columnsIds: string[];
    tableName: string;
}

function endpoints<T, F>(build: EndpointBuilder<BaseQueryFn, string, string>) {
    return {
        fetchTableChunk: build.query<PaginatedTableData<T>, PaginatedTableParams<T, F>>({
            queryFn: async (
                {offset, limit, sortParams, filters, columnsIds, fetchData, tableName},
                {signal},
            ) => {
                try {
                    // Use the request batcher for potential merging
                    const result = await requestBatcher.queueRequest(
                        {
                            offset,
                            limit,
                            sortParams,
                            filters,
                            columnsIds,
                            fetchData,
                            tableName,
                        },
                        signal,
                    );

                    if ('error' in result) {
                        return {error: result.error};
                    }

                    return result;
                } catch (error) {
                    return {error: error};
                }
            },
            providesTags: ['All'],
        }),
    };
}

export const tableDataApi = api.injectEndpoints({endpoints});
