import type {BaseQueryFn, EndpointBuilder} from '@reduxjs/toolkit/query';

import type {FetchData, PaginatedTableData, SortParams} from '../../components/PaginatedTable';

import {api} from './api';

interface PaginatedTableParams<T, F> {
    offset: number;
    fetchData: FetchData<T, F>;
    filters: F;
    limit: number;
    sortParams?: SortParams;
    tableName: string;
}

function endpoints<T, F>(build: EndpointBuilder<BaseQueryFn, string, string>) {
    return {
        fetchTableChunk: build.query<PaginatedTableData<T>, PaginatedTableParams<T, F>>({
            queryFn: async ({offset, limit, sortParams, filters, fetchData}, {signal}) => {
                try {
                    const response = await fetchData({
                        limit,
                        offset,
                        filters,
                        sortParams,
                        signal,
                    });
                    return {data: response};
                } catch (error) {
                    return {error: error};
                }
            },
            providesTags: ['All'],
        }),
    };
}

export const tableDataApi = api.injectEndpoints({endpoints});
