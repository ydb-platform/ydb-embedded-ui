import type {IQueryResult, QueryErrorResponse} from '../../../../types/store/query';
import type {ApiRequestAction} from '../../../utils';

import type {
    FETCH_TENANT_OVERVIEW_TOP_QUERIES,
    setDataWasNotLoaded,
} from './tenantOverviewTopQueries';

export interface TenantOverviewTopQueriesState {
    loading: boolean;
    wasLoaded: boolean;
    data?: IQueryResult;
    error?: QueryErrorResponse;
}

export type TenantOverviewTopQueriesAction =
    | ApiRequestAction<typeof FETCH_TENANT_OVERVIEW_TOP_QUERIES, IQueryResult, QueryErrorResponse>
    | ReturnType<typeof setDataWasNotLoaded>;
