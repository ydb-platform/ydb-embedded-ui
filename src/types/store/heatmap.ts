import type {ApiRequestAction} from '../../store/utils';
import {FETCH_HEATMAP, setHeatmapOptions} from '../../store/reducers/heatmap';

import type {IResponseError} from '../api/error';
import type {TTabletStateInfo} from '../api/tablet';
import type {TTableStats} from '../api/schema';
import type {TMetrics} from '../api/tenant';

export interface IHeatmapTabletData extends TTabletStateInfo {
    metrics?: TTableStats & TMetrics;
}

export type IHeatmapMetricValue = keyof TTableStats | keyof TMetrics;

interface IHeatmapMetric {
    value: IHeatmapMetricValue;
    content: IHeatmapMetricValue;
}

export interface IHeatmapState {
    loading: boolean;
    wasLoaded: boolean;
    currentMetric?: IHeatmapMetricValue;
    sort: boolean;
    heatmap: boolean;
    data?: IHeatmapTabletData[];
    metrics?: IHeatmapMetric[];
    error?: IResponseError;
}

export interface IHeatmapApiRequestParams {
    nodes?: string[];
    path: string;
}

interface IHeatmapHandledResponse {
    data: IHeatmapTabletData[];
    metrics?: IHeatmapMetric[];
}

type IHeatmapApiRequestAction = ApiRequestAction<
    typeof FETCH_HEATMAP,
    IHeatmapHandledResponse,
    IResponseError
>;

export type IHeatmapAction = IHeatmapApiRequestAction | ReturnType<typeof setHeatmapOptions>;

export interface IHeatmapRootStateSlice {
    heatmap: IHeatmapState;
}
