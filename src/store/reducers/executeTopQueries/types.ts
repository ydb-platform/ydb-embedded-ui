export interface TopQueriesFilters {
    /** ms from epoch */
    from?: number;
    /** ms from epoch */
    to?: number;
    text?: string;
}

export interface TopQueriesRootStateSlice {
    executeTopQueries: TopQueriesFilters;
}
