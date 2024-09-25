import {isLikeRelative} from '@gravity-ui/date-utils';
import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {isQueryErrorResponse, parseQueryAPIExecuteResponse} from '../../../utils/query';
import {api} from '../api';

import type {TopQueriesFilters} from './types';
import {getFiltersConditions} from './utils';

const initialState: TopQueriesFilters = {};

const slice = createSlice({
    name: 'executeTopQueries',
    initialState,
    reducers: {
        setTopQueriesFilters: (state, action: PayloadAction<TopQueriesFilters>) => {
            return {...state, ...action.payload};
        },
    },
});

export const {setTopQueriesFilters} = slice.actions;
export default slice.reducer;

const getQueryText = (path: string, filters?: TopQueriesFilters) => {
    const filterConditions = getFiltersConditions(path, filters);
    return `
SELECT
    CPUTime as CPUTimeUs,
    QueryText,
    IntervalEnd,
    EndTime,
    ReadRows,
    ReadBytes,
    UserSID,
    Duration
FROM \`${path}/.sys/top_queries_by_cpu_time_one_hour\`
WHERE ${filterConditions || 'true'}
ORDER BY CPUTimeUs DESC
`;
};

export const topQueriesApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTopQueries: build.query({
            queryFn: async (
                {database, filters}: {database: string; filters?: TopQueriesFilters},
                {signal},
            ) => {
                const preparedFilters = {
                    ...filters,
                    from: filters?.from || 'now-1h',
                    to: filters?.to || 'now',
                };

                try {
                    const response = await window.api.sendQuery(
                        {
                            schema: 'modern',
                            query: getQueryText(database, preparedFilters),
                            database,
                            action: 'execute-scan',
                        },
                        {signal, withRetries: true},
                    );

                    if (isQueryErrorResponse(response)) {
                        throw response;
                    }

                    const data = parseQueryAPIExecuteResponse(response);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            forceRefetch: ({currentArg}) => {
                if (
                    !currentArg?.filters?.from ||
                    !currentArg?.filters?.to ||
                    isLikeRelative(currentArg?.filters?.from) ||
                    isLikeRelative(currentArg?.filters?.to)
                ) {
                    return true;
                }

                return false;
            },
            providesTags: ['All'],
        }),
        getRunningQueries: build.query({
            queryFn: async (
                {database, filters}: {database: string; filters?: TopQueriesFilters},
                {signal},
            ) => {
                try {
                    const filterConditions = filters?.text ? `Query ILIKE '%${filters.text}%'` : '';
                    const queryText = `SELECT UserSID, QueryStartAt, Query as QueryText, ApplicationName from \`.sys/query_sessions\` WHERE ${filterConditions || 'true'} ORDER BY SessionStartAt limit 100`;

                    const response = await window.api.sendQuery(
                        {
                            query: queryText,
                            database,
                            action: 'execute-scan',
                        },
                        {signal, withRetries: true},
                    );

                    if (isQueryErrorResponse(response)) {
                        throw response;
                    }

                    return {data: response?.result?.filter((item) => item.QueryText !== queryText)};
                } catch (error) {
                    return {error};
                }
            },
            forceRefetch() {
                return true;
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
