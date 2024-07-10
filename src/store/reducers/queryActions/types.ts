export type QueryActions = 'save' | 'idle';

export interface QueryActionsState {
    queryName: string | null;
    queryAction: QueryActions;
}
