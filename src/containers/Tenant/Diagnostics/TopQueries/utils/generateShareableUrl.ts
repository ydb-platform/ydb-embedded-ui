import type {SortOrder} from '@gravity-ui/react-data-table';

import type {KeyValueRow} from '../../../../../types/api/query';

import {getTopQueryRowQueryParams} from './getTopQueryRowQueryParams';

/**
 * Generates a shareable URL with query parameters for a top query row
 * @param row The top query row data
 * @param tableSort Optional sort configuration to include in the URL
 * @returns A shareable URL string with the row's parameters and sort order encoded in the URL
 */
export function generateShareableUrl(row: KeyValueRow, tableSort?: SortOrder[]): string {
    const params = getTopQueryRowQueryParams(row);

    // Get current URL without query parameters
    const url = new URL(window.location.href);

    // Create URLSearchParams object from current search params
    const searchParams = new URLSearchParams(url.search);

    // Add our parameters
    // Set a single selectedRow parameter with all query parameters
    searchParams.set(
        'selectedRow',
        encodeURIComponent(
            JSON.stringify({
                rank: params.rank || undefined,
                intervalEnd: params.intervalEnd || undefined,
                endTime: params.endTime || undefined,
                queryHash: params.queryHash || undefined,
                tableSort: tableSort || undefined, // Include the table sort order
            }),
        ),
    );

    // Update URL search params
    url.search = searchParams.toString();

    return url.toString();
}
