import type {KeyValueRow} from '../../../../../types/api/query';
import {generateHash} from '../../../../../utils/generateHash';

/**
 * Extract query parameters from a running query row for use in URL search params
 * @param row The running query row data
 * @returns Parameters for URL search params
 */
/**
 * Generates query parameters for a running query row.
 *
 * @param row - The KeyValueRow object containing query details.
 * @returns An object containing the query hash, session ID, and query start time.
 */
export function getRunningQueryRowQueryParams(row: KeyValueRow) {
    const queryHash = generateHash(String(row.QueryText));
    const sessionIdHash = generateHash(String(row.SessionId || ''));

    return {
        queryHash,
        sessionIdHash,
        queryStart: String(row.QueryStartAt || ''),
    };
}
