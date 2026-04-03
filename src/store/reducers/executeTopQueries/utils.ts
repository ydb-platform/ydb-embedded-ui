import {dateTimeParse} from '@gravity-ui/date-utils';

import type {KeyValueRow} from '../../../types/api/query';
import type {IQueryResult} from '../../../types/store/query';

import type {TopQueriesFilters} from './types';

const endTimeColumn = 'EndTime';
const intervalEndColumn = 'IntervalEnd';

const getMaxIntervalSubquery = (tableName: string) => `(
    SELECT
        MAX(${intervalEndColumn})
    FROM \`${tableName}\`
)`;

export function getFiltersConditions(tableName: string, filters?: TopQueriesFilters) {
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
        conditions.push(`${endTimeColumn} ${gt} Timestamp('${new Date(from).toISOString()}')`);
    }

    if (to) {
        conditions.push(`${endTimeColumn} <= Timestamp('${new Date(to).toISOString()}')`);
    }

    // If there is no filters, return queries, that were executed in the last hour
    if (!from && !to) {
        conditions.push(`${intervalEndColumn} IN ${getMaxIntervalSubquery(tableName)}`);
    }

    if (filters?.text) {
        conditions.push(
            `(QueryText ILIKE '%${filters.text}%' OR UserSID ILIKE '%${filters.text}%')`,
        );
    }

    return conditions.join(' AND ');
}

/**
 * Remap 'Query' → 'QueryText' in each row, dropping the original key.
 * SELECT * returns 'Query', but the UI uses 'QueryText'.
 */
function normalizeQueryToQueryText(row: KeyValueRow): KeyValueRow {
    if (row.Query !== undefined && row.QueryText === undefined) {
        const {Query, ...rest} = row;
        return {...rest, QueryText: Query};
    }
    return row;
}

/** Normalize a parsed query response so the first result set uses 'QueryText'. */
export function normalizeQueryResult(parsed: IQueryResult): IQueryResult {
    const rows = parsed.resultSets?.[0]?.result;

    if (!rows) {
        return parsed;
    }

    return {
        ...parsed,
        resultSets: parsed.resultSets!.map((resultSet, index) =>
            index === 0 && resultSet.result
                ? {...resultSet, result: resultSet.result.map(normalizeQueryToQueryText)}
                : resultSet,
        ),
    };
}
