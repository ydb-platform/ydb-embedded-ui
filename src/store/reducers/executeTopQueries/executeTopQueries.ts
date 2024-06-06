import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {HOUR_IN_SECONDS} from '../../../utils/constants';
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
                    // FIXME: do we really need this?
                    if (!filters?.from && !filters?.to) {
                        const intervalEnd = data?.result?.[0]?.IntervalEnd;
                        if (intervalEnd) {
                            const to = new Date(intervalEnd).getTime();
                            const from = new Date(to - HOUR_IN_SECONDS * 1000).getTime();
                            dispatch(setTopQueriesFilters({from, to}));
                        }
                    }
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
