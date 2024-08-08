export type QueryActions = 'save' | 'idle' | 'settings';

export interface QueryActionsState {
    queryName: string | null;
    queryAction: QueryActions;
    savedQueriesFilter: string;
}
