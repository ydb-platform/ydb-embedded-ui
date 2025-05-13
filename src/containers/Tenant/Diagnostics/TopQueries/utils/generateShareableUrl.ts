import type {KeyValueRow} from '../../../../../types/api/query';

import {getTopQueryRowQueryParams} from './getTopQueryRowQueryParams';

/**
 * Generates a shareable URL with query parameters for a top query row
 * @param row The top query row data
 * @returns A shareable URL string with the row's parameters encoded in the URL
 */
export function generateShareableUrl(row: KeyValueRow): string {
    const params = getTopQueryRowQueryParams(row);

    const url = new URL(window.location.href);

    const searchParams = new URLSearchParams(url.search);

    searchParams.set(
        'selectedRow',
        encodeURIComponent(
            JSON.stringify({
                rank: params.rank || undefined,
                intervalEnd: params.intervalEnd || undefined,
                endTime: params.endTime || undefined,
                queryHash: params.queryHash || undefined,
            }),
        ),
    );

    url.search = searchParams.toString();

    return url.toString();
}
