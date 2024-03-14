import type {Reducer} from '@reduxjs/toolkit';

import type {
    IHeatmapAction,
    IHeatmapApiRequestParams,
    IHeatmapState,
    IHeatmapTabletData,
} from '../../types/store/heatmap';

import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_HEATMAP = createRequestActionTypes('heatmap', 'FETCH_HEATMAP');

const SET_HEATMAP_OPTIONS = 'heatmap/SET_HEATMAP_OPTIONS';

export const initialState = {
    loading: false,
    wasLoaded: false,
    currentMetric: undefined,
    sort: false,
    heatmap: false,
};

const heatmap: Reducer<IHeatmapState, IHeatmapAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_HEATMAP.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_HEATMAP.SUCCESS: {
            return {
                ...state,
                ...action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_HEATMAP.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
                wasLoaded: false,
            };
        }
        case SET_HEATMAP_OPTIONS:
            return {
                ...state,
                ...action.data,
            };
        default:
            return state;
    }
};

export function getTabletsInfo({nodes, path}: IHeatmapApiRequestParams) {
    return createApiRequest({
        request: Promise.all([
            window.api.getTabletsInfo({nodes, path}),
            window.api.getHeatmapData({path}),
        ]),
        actions: FETCH_HEATMAP,
        dataHandler: ([tabletsData = {}, describe]) => {
            const {TabletStateInfo: tablets = []} = tabletsData;
            const TabletsMap: Map<string, IHeatmapTabletData> = new Map();
            const {PathDescription = {}} = describe ?? {};
            const {
                TablePartitions = [],
                TablePartitionStats = [],
                TablePartitionMetrics = [],
            } = PathDescription;

            tablets.forEach((item) => {
                if (item.TabletId) {
                    TabletsMap.set(item.TabletId, item);
                }
            });

            TablePartitions.forEach((item, index) => {
                const metrics = Object.assign(
                    {},
                    TablePartitionStats[index],
                    TablePartitionMetrics[index],
                );
                if (item.DatashardId) {
                    TabletsMap.set(item.DatashardId, {
                        ...TabletsMap.get(item.DatashardId),
                        metrics,
                    });
                }
            });

            const preparedTablets = Array.from(TabletsMap.values());
            const selectMetrics =
                preparedTablets[0] &&
                preparedTablets[0].metrics &&
                Object.keys(preparedTablets[0].metrics).map((item) => {
                    return {
                        value: item,
                        content: item,
                    };
                });

            return {data: preparedTablets, metrics: selectMetrics};
        },
    });
}

export function setHeatmapOptions(options: Partial<IHeatmapState>) {
    return {
        type: SET_HEATMAP_OPTIONS,
        data: options,
    } as const;
}

export default heatmap;
