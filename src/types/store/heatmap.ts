import type {TTableStats} from '../api/schema';
import type {TTabletStateInfo} from '../api/tablet';
import type {TMetrics} from '../api/tenant';

export interface IHeatmapTabletData extends TTabletStateInfo {
    metrics?: TTableStats & TMetrics;
}

export type IHeatmapMetricValue = keyof TTableStats | keyof TMetrics;

export interface IHeatmapState {
    currentMetric?: IHeatmapMetricValue;
    sort: boolean;
    heatmap: boolean;
}

export interface IHeatmapApiRequestParams {
    path: string;
    database: string;
    databaseFullPath: string;
}
