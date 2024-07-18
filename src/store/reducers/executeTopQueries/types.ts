export interface TopQueriesFilters {
    /** ms from epoch */
    from?: string;
    /** ms from epoch */
    to?: string;
    text?: string;
}

export interface TopQueriesRootStateSlice {
    executeTopQueries: TopQueriesFilters;
}
