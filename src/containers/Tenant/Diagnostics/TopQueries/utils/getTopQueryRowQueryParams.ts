import type {KeyValueRow} from '../../../../../types/api/query';
import {generateHash} from '../../../../../utils/generateHash';
import type {SearchParamsQueryParams} from '../hooks/useSetSelectedTopQueryRowFromParams';

/**
 * Extract query parameters from a row for use in URL search params
 * @param row The top query row data
 * @returns Parameters for URL search params
 */
export function getTopQueryRowQueryParams(row: KeyValueRow): SearchParamsQueryParams {
    const queryHash = generateHash(String(row.QueryText));

    return {
        rank: String(row.Rank),
        intervalEnd: String(row.IntervalEnd),
        endTime: String(row.EndTime),
        queryHash,
    };
}
