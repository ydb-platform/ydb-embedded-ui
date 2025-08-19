import {isLikeRelative} from '@gravity-ui/date-utils';
import type {SortOrder} from '@gravity-ui/react-data-table';
import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {QUERY_TECHNICAL_MARK} from '../../../utils/constants';
import {prepareOrderByFromTableSort} from '../../../utils/hooks/useTableSort';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../utils/query';
import {api} from '../api';

import {TOP_QUERIES_TABLES} from './constants';
import type {TimeFrame, TopQueriesFilters} from './types';
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

const getQueryText = (
    timeFrame: TimeFrame,
    filters?: TopQueriesFilters,
    sortOrder?: SortOrder[],
    limit?: number,
) => {
    const orderBy = prepareOrderByFromTableSort(sortOrder);

    // Determine the metric type based on sort field
    let metricType = TOP_QUERIES_TABLES.CPU_TIME; // Default to CPU_TIME

    if (sortOrder && sortOrder.length > 0) {
        const primarySortField = sortOrder[0].columnId;

        if (primarySortField === 'Duration') {
            metricType = TOP_QUERIES_TABLES.DURATION;
        } else if (primarySortField === 'ReadBytes') {
            metricType = TOP_QUERIES_TABLES.READ_BYTES;
        } else if (primarySortField === 'RequestUnits') {
            metricType = TOP_QUERIES_TABLES.REQUEST_UNITS;
        } else if (primarySortField === 'CPUTime') {
            metricType = TOP_QUERIES_TABLES.CPU_TIME;
        }
    }

    // Select the appropriate table based on timeFrame filter
    const tableName = timeFrame === 'minute' ? metricType.ONE_MINUTE : metricType.ONE_HOUR;
    const filterConditions = getFiltersConditions(tableName, filters);

    return `${QUERY_TECHNICAL_MARK}
    SELECT
        CPUTime as CPUTimeUs,
        QueryText,
        IntervalEnd,
        EndTime,
        ReadRows,
        ReadBytes,
        UserSID,
        Duration,
        RequestUnits,
        Rank
FROM \`${tableName}\`
WHERE ${filterConditions || 'true'} AND QueryText NOT LIKE '%${QUERY_TECHNICAL_MARK}%'
${orderBy}
LIMIT ${limit || 100}
`;
};

function getRunningQueriesText(
    filters?: TopQueriesFilters,
    sortOrder?: SortOrder[],
    limit?: number,
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
    ApplicationName,
    SessionId
FROM \`.sys/query_sessions\`
WHERE ${filterConditions || 'true'} AND Query NOT LIKE '%${QUERY_TECHNICAL_MARK}%'
AND QueryStartAt is not null ${orderBy}
LIMIT ${limit || 100}`;
}

interface QueriesRequestParams {
    database: string;
    filters?: TopQueriesFilters;
    sortOrder?: SortOrder[];
    limit?: number;
}

type TopQueriesRequestParams = QueriesRequestParams & {timeFrame: TimeFrame};

type RunningQueriesRequestParams = QueriesRequestParams;

export const topQueriesApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTopQueries: build.query({
            queryFn: async (
                {database, filters, sortOrder, timeFrame, limit}: TopQueriesRequestParams,
                {signal},
            ) => {
                const preparedFilters = {
                    ...filters,
                    from: filters?.from || 'now-6h',
                    to: filters?.to || 'now',
                };

                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: getQueryText(timeFrame, preparedFilters, sortOrder, limit),
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
            queryFn: async (
                {database, filters, sortOrder, limit}: RunningQueriesRequestParams,
                {signal},
            ) => {
                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query: getRunningQueriesText(filters, sortOrder, limit),
                            database,
                            action: 'execute-scan',
                            internal_call: true,
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
