export type QueryActions = 'idle' | 'settings';

export interface QueryActionsState {
    queryAction: QueryActions;
    savedQueriesFilter: string;
}
