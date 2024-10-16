import {dateTimeParse} from '@gravity-ui/date-utils';

import type {TopQueriesFilters} from './types';

const endTimeColumn = 'EndTime';
const intervalEndColumn = 'IntervalEnd';

const getMaxIntervalSubquery = (path: string) => `(
    SELECT
        MAX(${intervalEndColumn})
    FROM \`${path}/.sys/top_queries_by_cpu_time_one_hour\`
)`;

export function getFiltersConditions(path: string, filters?: TopQueriesFilters) {
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
        conditions.push(`${intervalEndColumn} IN ${getMaxIntervalSubquery(path)}`);
    }

    if (filters?.text) {
        conditions.push(
            `(QueryText ILIKE '%${filters.text}%' OR UserSID ILIKE '%${filters.text}%')`,
        );
    }

    return conditions.join(' AND ');
}
