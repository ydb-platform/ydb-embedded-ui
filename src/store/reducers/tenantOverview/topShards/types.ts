import type {IQueryResult, QueryErrorResponse} from '../../../../types/store/query';
import type {ApiRequestAction} from '../../../utils';
import {FETCH_TENANT_OVERVIEW_TOP_SHARDS, setDataWasNotLoaded} from './tenantOverviewTopShards';

export interface TenantOverviewTopShardsState {
    loading: boolean;
    wasLoaded: boolean;
    data?: IQueryResult;
    error?: QueryErrorResponse;
}

export type TenantOverviewTopShardsAction =
    | ApiRequestAction<typeof FETCH_TENANT_OVERVIEW_TOP_SHARDS, IQueryResult, QueryErrorResponse>
    | ReturnType<typeof setDataWasNotLoaded>;
