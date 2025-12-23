import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import type {TEvDescribeSchemeResult} from '../../types/api/schema';
import type {TEvTabletStateResponse} from '../../types/api/tablet';
import type {
    IHeatmapApiRequestParams,
    IHeatmapMetricValue,
    IHeatmapState,
    IHeatmapTabletData,
} from '../../types/store/heatmap';
import type {Nullable} from '../../utils/typecheckers';
import type {RootState} from '../defaultStore';

import {api} from './api';

export const initialState: IHeatmapState = {
    currentMetric: undefined,
    sort: false,
    heatmap: false,
};

const slice = createSlice({
    name: 'heatmap',
    initialState,
    reducers: {
        setHeatmapOptions: (state, action: PayloadAction<Partial<IHeatmapState>>) => {
            return {
                ...state,
                ...action.payload,
            };
        },
    },
});

export default slice.reducer;

export const {setHeatmapOptions} = slice.actions;

export const heatmapApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getHeatmapTabletsInfo: builder.query({
            queryFn: async (
                {path, database, databaseFullPath, useMetaProxy}: IHeatmapApiRequestParams,
                {signal, getState, dispatch},
            ) => {
                try {
                    const response = await Promise.all([
                        window.api.viewer.getTabletsInfo(
                            {path: {path, databaseFullPath, useMetaProxy}, database},
                            {signal},
                        ),
                        window.api.viewer.getHeatmapData(
                            {path: {path, databaseFullPath, useMetaProxy}, database},
                            {signal},
                        ),
                    ]);
                    const data = transformResponse(response);

                    if (data.metrics?.length) {
                        const state = getState() as RootState;
                        const currentMetric = state.heatmap.currentMetric;
                        if (
                            !currentMetric ||
                            !data.metrics.find((item) => item.value === currentMetric)
                        ) {
                            dispatch(setHeatmapOptions({currentMetric: data.metrics[0].value}));
                        }
                    }

                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});

function transformResponse([tabletsData, describe]: [
    TEvTabletStateResponse,
    Nullable<TEvDescribeSchemeResult>,
]) {
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
        const metrics = Object.assign({}, TablePartitionStats[index], TablePartitionMetrics[index]);
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
        (Object.keys(preparedTablets[0].metrics).map((item) => {
            return {
                value: item,
                content: item,
            };
        }) as {value: IHeatmapMetricValue; content: IHeatmapMetricValue}[]);

    return {tablets: preparedTablets, metrics: selectMetrics};
}
