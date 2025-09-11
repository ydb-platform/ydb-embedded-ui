import {dateTimeParse} from '@gravity-ui/date-utils';
import type {SortOrder} from '@gravity-ui/react-data-table';

import {QUERY_TECHNICAL_MARK} from './constants';
import {prepareOrderByFromTableSort} from './hooks/useTableSort';

export function createTimeConditions(from?: string | number, to?: string | number): string {
    const conditions: string[] = [];
    const toTime = dateTimeParse(Number(to) || to)?.valueOf();
    const fromTime = dateTimeParse(Number(from) || from)?.valueOf();

    if (fromTime && toTime && fromTime > toTime) {
        throw new Error('Invalid date range');
    }

    if (fromTime) {
        // matching `from` & `to` is an edge case
        // other cases should not include the starting point, since intervals are stored using the ending time
        const gt = toTime === fromTime ? '>=' : '>';
        conditions.push(`IntervalEnd ${gt} Timestamp('${new Date(fromTime).toISOString()}')`);
    }

    if (toTime) {
        conditions.push(`IntervalEnd <= Timestamp('${new Date(toTime).toISOString()}')`);
    }

    return conditions.join(' AND ');
}

export function createPartitionStatsQuery(options: {
    databaseFullPath: string;
    path?: string;
    selectFields?: string[];
    sortOrder?: SortOrder[];
    limit?: number;
}): string {
    const {databaseFullPath, path = '', selectFields = ['*'], sortOrder, limit = 20} = options;

    const pathSelect = createRelativePathSelect(databaseFullPath);
    const pathCondition = createPathWhereCondition(path);
    const orderBy = prepareOrderByFromTableSort(sortOrder);

    const whereClause = pathCondition ? `WHERE ${pathCondition}` : '';
    const fields = selectFields.includes('*')
        ? `${pathSelect}, \`.sys/partition_stats\`.*`
        : `${pathSelect}, ${selectFields.join(', ')}`;

    return `${QUERY_TECHNICAL_MARK}
SELECT
    ${fields}
FROM \`.sys/partition_stats\`
${whereClause}
${orderBy}
LIMIT ${limit}`;
}

export function createTopPartitionsHistoryQuery(options: {
    databaseFullPath: string;
    path?: string;
    timeConditions?: string;
    sortOrder?: SortOrder[];
    limit?: number;
}): string {
    const {databaseFullPath, path = '', timeConditions = '', sortOrder, limit = 20} = options;

    const pathSelect = createRelativePathSelect(databaseFullPath);
    const pathCondition = createPathWhereCondition(path);
    const orderBy = prepareOrderByFromTableSort(sortOrder);

    const conditions: string[] = [];
    if (pathCondition) {
        conditions.push(`(${pathCondition})`);
    }
    if (timeConditions) {
        conditions.push(timeConditions);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return `${QUERY_TECHNICAL_MARK}
SELECT
    ${pathSelect},
    \`.sys/top_partitions_one_hour\`.*
FROM \`.sys/top_partitions_one_hour\`
${whereClause}
${orderBy}
LIMIT ${limit}`;
}

function createRelativePathSelect(databaseFullPath: string): string {
    return `CAST(SUBSTRING(CAST(Path AS String), ${databaseFullPath.length + 1}) AS Utf8) AS RelativePath`;
}

function createPathWhereCondition(path: string): string {
    if (!path) {
        return '';
    }
    return `Path='${path}' OR Path LIKE '${path}/%'`;
}
