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
                {signal, dispatch},
            ) => {
                try {
                    const response = await window.api.sendQuery(
                        {
                            schema: 'modern',
                            query: getQueryText(database, filters),
                            database,
                            action: 'execute-scan',
                        },
                        {signal},
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    const data = parseQueryAPIExecuteResponse(response);

                    if (!filters?.from && !filters?.to) {
                        dispatch(setTopQueriesFilters({from: 'now-1h', to: 'now'}));
                    }
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            forceRefetch: ({currentArg}) => {
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
