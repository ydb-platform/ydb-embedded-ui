import type {
    changeUserInput,
    goToNextQuery,
    goToPreviousQuery,
    saveQueryToHistory,
    setQueryHistoryFilter,
    setTenantPath,
} from '../../store/reducers/executeQuery';

export interface QueryInHistory {
    queryText: string;
    syntax?: string;
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
    | ReturnType<typeof setTenantPath>
    | ReturnType<typeof setQueryHistoryFilter>;

export interface ExecuteQueryStateSlice {
    executeQuery: ExecuteQueryState;
}
