import type {IResponseError} from '../../../../types/api/error';
import type {ApiRequestAction} from '../../../utils';
import type {PreparedStorageGroup} from '../../storage/types';

import type {FETCH_TOP_STORAGE_GROUPS, setDataWasNotLoaded} from './topStorageGroups';

export interface TopStorageGroupsState {
    loading: boolean;
    wasLoaded: boolean;
    data?: PreparedStorageGroup[];
    error?: IResponseError;
}

export interface PreparedTopStorageGroupsResponse {
    groups?: PreparedStorageGroup[];
}

type GetTopStorageGroupApiRequestAction = ApiRequestAction<
    typeof FETCH_TOP_STORAGE_GROUPS,
    PreparedTopStorageGroupsResponse,
    IResponseError
>;

export type TopStorageGroupsAction =
    | GetTopStorageGroupApiRequestAction
    | ReturnType<typeof setDataWasNotLoaded>;

export interface TopStorageGroupsStateSlice {
    topStorageGroups: TopStorageGroupsState;
}
