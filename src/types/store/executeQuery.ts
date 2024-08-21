import type {
    changeUserInput,
    goToNextQuery,
    goToPreviousQuery,
    saveQueryToHistory,
    setQueryHistoryFilter,
    setTenantPath,
    updateQueryInHistory,
} from '../../store/reducers/executeQuery';

export interface QueryInHistory {
    queryId?: string;
    queryText: string;
    syntax?: string;
    endTime?: string | number;
    durationUs?: string | number;
}

export interface ExecuteQueryState {
    loading: boolean;
    input: string;
    history: {
        // String type for backward compatibility
        queries: QueryInHistory[];
        currentIndex: number;
        filter?: string;
    };
    tenantPath?: string;
}

export type ExecuteQueryAction =
    | ReturnType<typeof goToNextQuery>
    | ReturnType<typeof goToPreviousQuery>
    | ReturnType<typeof changeUserInput>
    | ReturnType<typeof saveQueryToHistory>
    | ReturnType<typeof updateQueryInHistory>
    | ReturnType<typeof setTenantPath>
    | ReturnType<typeof setQueryHistoryFilter>;

export interface ExecuteQueryStateSlice {
    executeQuery: ExecuteQueryState;
}
