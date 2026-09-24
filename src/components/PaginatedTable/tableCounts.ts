import isEqual from 'lodash/isEqual';

import type {getTableChunkQueryParams} from './getTableChunkQueryParams';
import type {PaginatedTableState} from './types';

type TableQuery = Omit<ReturnType<typeof getTableChunkQueryParams>, 'offset' | 'fetchData'>;

export interface TableCountsState
    extends Pick<PaginatedTableState, 'totalEntities' | 'foundEntities' | 'isInitialLoad'> {
    query?: TableQuery;
    hasLoadedData: boolean;
}

export type TableCountsAction =
    | {type: 'initialize'; query: TableQuery; initialEntitiesCount?: number}
    | {type: 'dataReceived'; query: TableQuery; total: number; found: number};

export function tableCountsReducer(
    state: TableCountsState,
    action: TableCountsAction,
): TableCountsState {
    // Cached chunks can report their data before the table's initialization effect.
    if (
        action.type === 'initialize' &&
        isEqual(state.query, action.query) &&
        !state.isInitialLoad
    ) {
        return state;
    }

    let nextState: TableCountsState;
    if (action.type === 'dataReceived') {
        nextState = {
            query: action.query,
            totalEntities: action.total,
            foundEntities: action.found,
            isInitialLoad: false,
            hasLoadedData: true,
        };
    } else {
        // Keep the virtualized table's size until the next query returns its actual counts.
        nextState = {...state, query: action.query, isInitialLoad: true};
        if (!state.hasLoadedData) {
            nextState.totalEntities = action.initialEntitiesCount ?? 0;
            nextState.foundEntities = action.initialEntitiesCount ?? 1;
        }
    }

    return isEqual(state, nextState) ? state : nextState;
}
