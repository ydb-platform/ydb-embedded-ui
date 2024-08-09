import type {BaseQueryFn, EndpointBuilder} from '@reduxjs/toolkit/query';

import type {FetchData, PaginatedTableData, SortParams} from '../../components/PaginatedTable';

import {api} from './api';

interface PaginatedTableParams<T, F> {
    id: number;
    fetchData: FetchData<T, F>;
    filters: F;
    chunkSize: number;
    sortParams?: SortParams;
}

function endpoints<T, F>(build: EndpointBuilder<BaseQueryFn, string, string>) {
    return {
        fetchTableChunk: build.query<PaginatedTableData<T>, PaginatedTableParams<T, F>>({
            queryFn: async ({id, chunkSize, sortParams, filters, fetchData}, {signal}) => {
                try {
                    const offset = id * chunkSize;
                    const response = await fetchData(
                        chunkSize,
                        offset,
                        filters,
                        sortParams,
                        signal,
                    );
                    return {data: response};
                } catch (error: unknown) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    };
}

export const tableDataApi = api.injectEndpoints({endpoints});
