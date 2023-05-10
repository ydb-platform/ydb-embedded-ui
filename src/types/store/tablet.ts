import type {IResponseError} from '../api/error';
import type {ETabletState, TTabletStateInfo} from '../api/tablet';

import {FETCH_TABLET, FETCH_TABLET_DESCRIBE} from '../../store/reducers/tablet';
import {ApiRequestAction} from '../../store/utils';

export interface ITabletPreparedHistoryItem {
    nodeId: string;
    generation: number | undefined;
    changeTime: string | undefined;
    state: ETabletState | undefined;
    leader: boolean | undefined;
    followerId: number | undefined;
    fqdn: string | undefined;
}

export interface ITabletState {
    loading: boolean;
    tenantPath: string;
    error?: IResponseError;
    id?: string;
    history?: ITabletPreparedHistoryItem[];
    data?: TTabletStateInfo;
}

export interface ITabletHandledResponse {
    tabletData: TTabletStateInfo;
    historyData: ITabletPreparedHistoryItem[];
}

export interface ITabletDescribeHandledResponse {
    tenantPath: string;
}

type ITabletApiRequestAction = ApiRequestAction<
    typeof FETCH_TABLET,
    ITabletHandledResponse,
    IResponseError
>;

type ITabletDescribeApiRequestAction = ApiRequestAction<
    typeof FETCH_TABLET_DESCRIBE,
    ITabletDescribeHandledResponse,
    IResponseError
>;

export type ITabletAction = ITabletApiRequestAction | ITabletDescribeApiRequestAction;

export interface ITabletRootStateSlice {
    tablet: ITabletState;
}
