import {dateTimeParse, isLikeRelative} from '@gravity-ui/date-utils';
import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {isQueryErrorResponse, parseQueryAPIExecuteResponse} from '../../../utils/query';
import {api} from '../api';

import type {ShardsWorkloadFilters} from './types';
import {EShardsWorkloadMode} from './types';

const initialState: ShardsWorkloadFilters = {};

export interface SortOrder {
    columnId: string;
    order: string;
}

function formatSortOrder({columnId, order}: SortOrder) {
    return `${columnId} ${order}`;
}

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
    filters?: ShardsWorkloadFilters,
    sortOrder?: SortOrder[],
    tenantName?: string,
) {
    const pathSelect = tenantName
        ? `CAST(SUBSTRING(CAST(Path AS String), ${tenantName.length}) AS Utf8) AS Path`
        : 'Path';

    let where = `Path='${path}' OR Path LIKE '${path}/%'`;

    const filterConditions = getFiltersConditions(filters);
    if (filterConditions.length) {
        where = `(${where}) AND ${filterConditions}`;
    }

    const orderBy = sortOrder ? `ORDER BY ${sortOrder.map(formatSortOrder).join(', ')}` : '';

    return `SELECT
    ${pathSelect},
    TabletId,
    CPUCores,
    DataSize,
    NodeId,
    PeakTime,
    InFlightTxCount,
    IntervalEnd
FROM \`.sys/top_partitions_one_hour\`
WHERE ${where}
${orderBy}
LIMIT 20`;
}

function createShardQueryImmediate(path: string, sortOrder?: SortOrder[], tenantName?: string) {
    const pathSelect = tenantName
        ? `CAST(SUBSTRING(CAST(Path AS String), ${tenantName.length}) AS Utf8) AS Path`
        : 'Path';

    const orderBy = sortOrder ? `ORDER BY ${sortOrder.map(formatSortOrder).join(', ')}` : '';

    return `SELECT
    ${pathSelect},
    TabletId,
    CPUCores,
    DataSize,
    NodeId,
    InFlightTxCount
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
    database?: string;
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
                    const response = await window.api.sendQuery(
                        {
                            schema: 'modern',
                            query:
                                filters?.mode === EShardsWorkloadMode.Immediate
                                    ? createShardQueryImmediate(path, sortOrder, database)
                                    : createShardQueryHistorical(
                                          path,
                                          filters,
                                          sortOrder,
                                          database,
                                      ),
                            database,
                            action: queryAction,
                        },
                        {
                            signal,
                            withRetries: true,
                        },
                    );

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    const data = parseQueryAPIExecuteResponse(response);
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
