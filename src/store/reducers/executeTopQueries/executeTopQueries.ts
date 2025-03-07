import {isLikeRelative} from '@gravity-ui/date-utils';
import type {SortOrder} from '@gravity-ui/react-data-table';
import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {QUERY_TECHNICAL_MARK} from '../../../utils/constants';
import {prepareOrderByFromTableSort} from '../../../utils/hooks/useTableSort';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../utils/query';
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

const getQueryText = (database: string, filters?: TopQueriesFilters, sortOrder?: SortOrder[]) => {
    const filterConditions = getFiltersConditions(database, filters);

    const orderBy = prepareOrderByFromTableSort(sortOrder);

    return `${QUERY_TECHNICAL_MARK}
SELECT
    CPUTime as CPUTimeUs,
    QueryText,
    IntervalEnd,
    EndTime,
    ReadRows,
    ReadBytes,
    UserSID,
    Duration
FROM \`${database}/.sys/top_queries_by_cpu_time_one_hour\`
WHERE ${filterConditions || 'true'} AND QueryText NOT LIKE '%${QUERY_TECHNICAL_MARK}%'
${orderBy}
LIMIT 100
`;
};

function getRunningQueriesText(
    database: string,
    filters?: TopQueriesFilters,
    sortOrder?: SortOrder[],
) {
    const filterConditions = filters?.text
        ? `Query ILIKE '%${filters.text}%' OR UserSID ILIKE '%${filters.text}%'`
        : '';

    const orderBy = prepareOrderByFromTableSort(sortOrder);

    return `${QUERY_TECHNICAL_MARK}
SELECT
    UserSID, 
    QueryStartAt, 
    Query as QueryText, 
    ApplicationName
FROM \`${database}/.sys/query_sessions\`
WHERE ${filterConditions || 'true'} AND Query NOT LIKE '%${QUERY_TECHNICAL_MARK}%'
${orderBy}
LIMIT 100`;
}

interface TopQueriesRequestParams {
    database: string;
    filters?: TopQueriesFilters;
    sortOrder?: SortOrder[];
}

export const topQueriesApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTopQueries: build.query({
            queryFn: async ({database, filters, sortOrder}: TopQueriesRequestParams, {signal}) => {
                const preparedFilters = {
                    ...filters,
                    from: filters?.from || 'now-1h',
                    to: filters?.to || 'now',
                };

                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: getQueryText(database, preparedFilters, sortOrder),
                            database,
                            action: 'execute-scan',
                        },
                        {signal, withRetries: true},
                    );

                    if (isQueryErrorResponse(response)) {
                        throw response;
                    }

                    const data = parseQueryAPIResponse(response);
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
            queryFn: async ({database, filters, sortOrder}: TopQueriesRequestParams, {signal}) => {
                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: getRunningQueriesText(database, filters, sortOrder),
                            database,
                            action: 'execute-scan',
                        },
                        {signal, withRetries: true},
                    );

                    if (isQueryErrorResponse(response)) {
                        throw response;
                    }

                    const data = parseQueryAPIResponse(response);

                    return {data};
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
