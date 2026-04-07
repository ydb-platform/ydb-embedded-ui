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

export function createTopPartitionsOneMinuteQuery(options: {
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
    \`.sys/top_partitions_one_minute\`.*
FROM \`.sys/top_partitions_one_minute\`
${whereClause}
${orderBy}
LIMIT ${limit}`;
}

/**
 * Creates a historical top partitions query that combines data from both
 * `top_partitions_one_hour` (for completed hours) and `top_partitions_one_minute`
 * (for the ongoing hour) to ensure up-to-date historical visibility.
 */
export function createCombinedTopPartitionsHistoryQuery(options: {
    databaseFullPath: string;
    path?: string;
    from?: string | number;
    to?: string | number;
    sortOrder?: SortOrder[];
    limit?: number;
}): string {
    const {databaseFullPath, path, from, to, sortOrder, limit = 20} = options;

    const fromTime = dateTimeParse(Number(from) || from)?.valueOf();
    const toTime = dateTimeParse(Number(to) || to)?.valueOf();
    const currentHourStart = getCurrentHourStart();

    const needsMinuteTable = toTime === undefined || toTime > currentHourStart;
    const needsHourTable = fromTime === undefined || fromTime < currentHourStart;

    if (needsMinuteTable && needsHourTable) {
        return createUnionTopPartitionsQuery({
            databaseFullPath,
            path,
            hourlyTimeConditions: createTimeConditions(from, currentHourStart),
            minuteTimeConditions: createTimeConditions(currentHourStart, to),
            sortOrder,
            limit,
        });
    }

    if (needsMinuteTable) {
        return createTopPartitionsOneMinuteQuery({
            databaseFullPath,
            path,
            timeConditions: createTimeConditions(from, to),
            sortOrder,
            limit,
        });
    }

    return createTopPartitionsHistoryQuery({
        databaseFullPath,
        path,
        timeConditions: createTimeConditions(from, to),
        sortOrder,
        limit,
    });
}

function getCurrentHourStart(): number {
    return Math.floor(Date.now() / 3600000) * 3600000;
}

function createUnionTopPartitionsQuery(options: {
    databaseFullPath: string;
    path?: string;
    hourlyTimeConditions: string;
    minuteTimeConditions: string;
    sortOrder?: SortOrder[];
    limit: number;
}): string {
    const {
        databaseFullPath,
        path = '',
        hourlyTimeConditions,
        minuteTimeConditions,
        sortOrder,
        limit,
    } = options;

    const pathSelect = createRelativePathSelect(databaseFullPath);
    const pathCondition = createPathWhereCondition(path);
    const orderBy = prepareOrderByFromTableSort(sortOrder);

    const hourlyConditions: string[] = [];
    if (pathCondition) {
        hourlyConditions.push(`(${pathCondition})`);
    }
    if (hourlyTimeConditions) {
        hourlyConditions.push(hourlyTimeConditions);
    }
    const hourlyWhere =
        hourlyConditions.length > 0 ? `WHERE ${hourlyConditions.join(' AND ')}` : '';

    const minuteConditions: string[] = [];
    if (pathCondition) {
        minuteConditions.push(`(${pathCondition})`);
    }
    if (minuteTimeConditions) {
        minuteConditions.push(minuteTimeConditions);
    }
    const minuteWhere =
        minuteConditions.length > 0 ? `WHERE ${minuteConditions.join(' AND ')}` : '';

    return `${QUERY_TECHNICAL_MARK}
SELECT
    ${pathSelect},
    \`.sys/top_partitions_one_hour\`.*
FROM \`.sys/top_partitions_one_hour\`
${hourlyWhere}
UNION ALL
SELECT
    ${pathSelect},
    \`.sys/top_partitions_one_minute\`.*
FROM \`.sys/top_partitions_one_minute\`
${minuteWhere}
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
    // Escape single quotes to prevent SQL injection
    const escapedPath = path.replace(/'/g, "''");
    return `Path='${escapedPath}' OR Path LIKE '${escapedPath}/%'`;
}
