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

    if (filters?.from && filters?.to && filters.from > filters.to) {
        throw new Error('Invalid date range');
    }

    if (filters?.from) {
        // matching `from` & `to` is an edge case
        // other cases should not include the starting point, since intervals are stored using the ending time
        const gt = filters.to === filters.from ? '>=' : '>';
        conditions.push(
            `${endTimeColumn} ${gt} Timestamp('${new Date(filters.from).toISOString()}')`,
        );
    }

    if (filters?.to) {
        conditions.push(`${endTimeColumn} <= Timestamp('${new Date(filters.to).toISOString()}')`);
    }

    // If there is no filters, return queries, that were executed in the last hour
    if (!filters?.from && !filters?.to) {
        conditions.push(`${intervalEndColumn} IN ${getMaxIntervalSubquery(path)}`);
    }

    if (filters?.text) {
        conditions.push(`QueryText ILIKE '%${filters.text}%'`);
    }

    return conditions.join(' AND ');
}
