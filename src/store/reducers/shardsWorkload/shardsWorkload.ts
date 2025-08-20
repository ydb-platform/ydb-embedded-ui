import {dateTimeParse, isLikeRelative} from '@gravity-ui/date-utils';
import type {SortOrder} from '@gravity-ui/react-data-table';
import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {QUERY_TECHNICAL_MARK} from '../../../utils/constants';
import {prepareOrderByFromTableSort} from '../../../utils/hooks/useTableSort';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../utils/query';
import {api} from '../api';

import type {ShardsWorkloadFilters} from './types';
import {EShardsWorkloadMode} from './types';

const initialState: ShardsWorkloadFilters = {};

function getFiltersConditions(filters?: ShardsWorkloadFilters) {
    const conditions: string[] = [];
    const to = dateTimeParse(Number(filters?.to) || filters?.to)?.valueOf();
    const from = dateTimeParse(Number(filters?.from) || filters?.from)?.valueOf();

    if (from && to && from > to) {
        throw new Error('Invalid date range');
    }

    if (from) {
        // matching `from` & `to` is an edge case
        // other cases should not include the starting point, since intervals are stored using the ending time
        const gt = to === from ? '>=' : '>';
        conditions.push(`IntervalEnd ${gt} Timestamp('${new Date(from).toISOString()}')`);
    }

    if (to) {
        conditions.push(`IntervalEnd <= Timestamp('${new Date(to).toISOString()}')`);
    }

    return conditions.join(' AND ');
}

function createShardQueryHistorical(
    path: string,
    database: string,
    filters?: ShardsWorkloadFilters,
    sortOrder?: SortOrder[],
) {
    const pathSelect = `CAST(SUBSTRING(CAST(Path AS String), ${database.length}) AS Utf8) AS RelativePath`;

    let where = `Path='${path}' OR Path LIKE '${path}/%'`;

    const filterConditions = getFiltersConditions(filters);
    if (filterConditions.length) {
        where = `(${where}) AND ${filterConditions}`;
    }

    const orderBy = prepareOrderByFromTableSort(sortOrder);

    return `${QUERY_TECHNICAL_MARK}    
SELECT
    ${pathSelect},
    \`.sys/top_partitions_one_hour\`.*
FROM \`.sys/top_partitions_one_hour\`
WHERE ${where}
${orderBy}
LIMIT 20`;
}

function createShardQueryImmediate(path: string, database: string, sortOrder?: SortOrder[]) {
    const pathSelect = `CAST(SUBSTRING(CAST(Path AS String), ${database.length}) AS Utf8) AS RelativePath`;

    const orderBy = prepareOrderByFromTableSort(sortOrder);

    return `${QUERY_TECHNICAL_MARK}    
SELECT
    ${pathSelect},
    \`.sys/partition_stats\`.*
FROM \`.sys/partition_stats\`
WHERE
    Path='${path}'
    OR Path LIKE '${path}/%'
${orderBy}
LIMIT 20`;
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
    path?: string;
    sortOrder?: SortOrder[];
    filters?: ShardsWorkloadFilters;
}

export const shardApi = api.injectEndpoints({
    endpoints: (build) => ({
        sendShardQuery: build.query({
            queryFn: async (
                {database, path = '', sortOrder, filters}: SendShardQueryParams,
                {signal},
            ) => {
                try {
                    const response = await window.api.viewer.sendQuery(
                        {
                            query:
                                filters?.mode === EShardsWorkloadMode.Immediate
                                    ? createShardQueryImmediate(path, database, sortOrder)
                                    : createShardQueryHistorical(
                                          path,
                                          database,
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
