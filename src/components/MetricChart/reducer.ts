import {createRequestActionTypes} from '../../store/utils';
import type {IResponseError} from '../../types/api/error';

import type {PreparedMetricsData} from './types';

const FETCH_CHART_DATA = createRequestActionTypes('chart', 'FETCH_CHART_DATA');
const SET_CHART_DATA_WAS_NOT_LOADED = 'chart/SET_DATA_WAS_NOT_LOADED';

export const setChartDataLoading = () => {
    return {
        type: FETCH_CHART_DATA.REQUEST,
    } as const;
};

export const setChartData = (data: PreparedMetricsData) => {
    return {
        data,
        type: FETCH_CHART_DATA.SUCCESS,
    } as const;
};

export const setChartError = (error: IResponseError) => {
    return {
        error,
        type: FETCH_CHART_DATA.FAILURE,
    } as const;
};

export const setChartDataWasNotLoaded = () => {
    return {
        type: SET_CHART_DATA_WAS_NOT_LOADED,
    } as const;
};

type ChartAction =
    | ReturnType<typeof setChartDataLoading>
    | ReturnType<typeof setChartData>
    | ReturnType<typeof setChartError>
    | ReturnType<typeof setChartDataWasNotLoaded>;

interface ChartState {
    loading: boolean;
    wasLoaded: boolean;
    data: PreparedMetricsData;
    error: IResponseError | undefined;
}

export const initialChartState: ChartState = {
    // Set chart initial state as loading, in order not to mount and unmount component in between requests
    // as it leads to memory leak errors in console (not proper useEffect cleanups in chart component itself)
    // TODO: possible fix (check needed): chart component is always present, but display: none for chart while loading
    loading: true,
    wasLoaded: false,
    data: {timeline: [], metrics: []},
    error: undefined,
};

export const chartReducer = (state: ChartState, action: ChartAction) => {
    switch (action.type) {
        case FETCH_CHART_DATA.REQUEST: {
            return {...state, loading: true};
        }
        case FETCH_CHART_DATA.SUCCESS: {
            return {...state, loading: false, wasLoaded: true, error: undefined, data: action.data};
        }
        case FETCH_CHART_DATA.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error,
                // Clear data, so error will be displayed with empty chart
                data: {timeline: [], metrics: []},
                loading: false,
                wasLoaded: true,
            };
        }
        case SET_CHART_DATA_WAS_NOT_LOADED: {
            return {...state, wasLoaded: false};
        }
        default:
            return state;
    }
};
