export type TimeFrame = 'minute' | 'hour';

export interface TopQueriesFilters {
    /** ms from epoch */
    from?: string;
    /** ms from epoch */
    to?: string;
    text?: string;
}
