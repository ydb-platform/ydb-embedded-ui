import {isLikeRelative} from '@gravity-ui/date-utils';
import type {SortOrder} from '@gravity-ui/react-data-table';
import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../utils/query';
import {
    createPartitionStatsQuery,
    createTimeConditions,
    createTopPartitionsHistoryQuery,
} from '../../../utils/shardsQueryBuilders';
import {api} from '../api';

import type {ShardsWorkloadFilters} from './types';
import {EShardsWorkloadMode} from './types';

const initialState: ShardsWorkloadFilters = {};

function createShardQueryHistorical(
    path: string,
    databaseFullPath: string,
    filters?: ShardsWorkloadFilters,
    sortOrder?: SortOrder[],
) {
    const timeConditions = createTimeConditions(filters?.from, filters?.to);

    return createTopPartitionsHistoryQuery({
        databaseFullPath,
        path,
        timeConditions,
        sortOrder,
        limit: 20,
    });
}

function createShardQueryImmediate(
    path: string,
    databaseFullPath: string,
    sortOrder?: SortOrder[],
) {
    return createPartitionStatsQuery({
        databaseFullPath,
        path,
        sortOrder,
        limit: 20,
    });
}

const queryAction = 'execute-scan';

const slice = createSlice({
    name: 'shardsWorkload',
    initialState,
    reducers: {
        setShardsQueryFilters: (state, action: PayloadAction<ShardsWorkloadFilters>) => {
            return {
                ...state,
                ...action.payload,
            };
        },
    },
});

export const {setShardsQueryFilters} = slice.actions;
export default slice.reducer;

interface SendShardQueryParams {
    database: string;
    databaseFullPath: string;
    path?: string;
    sortOrder?: SortOrder[];
    filters?: ShardsWorkloadFilters;
}

export const shardApi = api.injectEndpoints({
    endpoints: (build) => ({
        sendShardQuery: build.query({
            queryFn: async (
                {database, path = '', sortOrder, filters, databaseFullPath}: SendShardQueryParams,
                {signal},
            ) => {
                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query:
                                filters?.mode === EShardsWorkloadMode.Immediate
                                    ? createShardQueryImmediate(path, databaseFullPath, sortOrder)
                                    : createShardQueryHistorical(
                                          path,
                                          databaseFullPath,
                                          filters,
                                          sortOrder,
                                      ),
                            database,
                            action: queryAction,
                            internal_call: true,
                        },
                        {
                            signal,
                            withRetries: true,
                        },
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    const data = parseQueryAPIResponse(response);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
            forceRefetch: ({currentArg}) => {
                if (currentArg?.filters?.mode === 'immediate') {
                    return true;
                }

                if (
                    isLikeRelative(currentArg?.filters?.from) ||
                    isLikeRelative(currentArg?.filters?.to)
                ) {
                    return true;
                }

                return false;
            },
        }),
    }),
    overrideExisting: 'throw',
});
