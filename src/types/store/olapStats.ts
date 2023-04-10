import {FETCH_OLAP_STATS, resetLoadingState} from '../../store/reducers/olapStats';
import type {ApiRequestAction} from '../../store/utils';
import type {IQueryResult} from './query';

export interface OlapStatsState {
    loading: boolean;
    wasLoaded: boolean;
    data?: IQueryResult;
    error?: unknown;
}

export type OlapStatsAction =
    | ApiRequestAction<typeof FETCH_OLAP_STATS, IQueryResult, unknown>
    | ReturnType<typeof resetLoadingState>;
