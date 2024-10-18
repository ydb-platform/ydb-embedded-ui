import type {BaseQueryFn, EndpointBuilder} from '@reduxjs/toolkit/query';

import type {FetchData, PaginatedTableData, SortParams} from '../../components/PaginatedTable';

import {api} from './api';

interface PaginatedTableParams<EntityType, Filters, DataFieldType> {
    offset: number;
    fetchData: FetchData<EntityType, Filters, DataFieldType>;
    filters: Filters;
    dataFieldsRequired?: DataFieldType[];
    limit: number;
    sortParams?: SortParams;
    tableName: string;
}

function endpoints<EntityType, Filters, DataFieldType>(
    build: EndpointBuilder<BaseQueryFn, string, string>,
) {
    return {
        fetchTableChunk: build.query<
            PaginatedTableData<EntityType>,
            PaginatedTableParams<EntityType, Filters, DataFieldType>
        >({
            queryFn: async (
                {offset, limit, sortParams, filters, dataFieldsRequired, fetchData},
                {signal},
            ) => {
                try {
                    const response = await fetchData({
                        limit,
                        offset,
                        filters,
                        dataFieldsRequired,
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
