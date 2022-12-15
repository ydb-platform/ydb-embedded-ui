import type {ApiRequestAction} from '../../store/utils';
import {
    clearWasLoadingFlag,
    FETCH_TABLETS,
    setStateFilter,
    setTypeFilter,
} from '../../store/reducers/tablets';

import type {IResponseError} from '../api/error';
import type {TEvTabletStateResponse, EType, ETabletState} from '../api/tablet';

export interface ITabletsState {
    loading: boolean;
    wasLoaded: boolean;
    stateFilter: ETabletState[];
    typeFilter: EType[];
    data?: TEvTabletStateResponse;
    error?: IResponseError;
}

export interface ITabletsApiRequestParams {
    nodes?: string[];
    path?: string;
}

type ITabletsApiRequestAction = ApiRequestAction<
    typeof FETCH_TABLETS,
    TEvTabletStateResponse,
    IResponseError
>;

export type ITabletsAction =
    | ITabletsApiRequestAction
    | (
          | ReturnType<typeof clearWasLoadingFlag>
          | ReturnType<typeof setStateFilter>
          | ReturnType<typeof setTypeFilter>
      );

export interface ITabletsRootStateSlice {
    tablets: ITabletsState;
}
