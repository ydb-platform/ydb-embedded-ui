import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_TABLETS = createRequestActionTypes('heatmap', 'FETCH_TABLETS');
const SET_HEATMAP_OPTIONS = 'heatmap/SET_HEATMAP_OPTIONS';

export const initialState = {
    loading: false,
    wasLoaded: false,
    currentMetric: undefined,
    sort: false,
    heatmap: false,
};

const tablets = function z(state = initialState, action) {
    switch (action.type) {
        case FETCH_TABLETS.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_TABLETS.SUCCESS: {
            return {
                ...state,
                ...action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_TABLETS.FAILURE: {
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

export function getTabletsInfo({nodes, path}) {
    return createApiRequest({
        request: Promise.all([
            window.api.getTabletsInfo({nodes, path}),
            window.api.getHeatmapData({path}),
        ]),
        actions: FETCH_TABLETS,
        dataHandler: ([tabletsData = [], describe = {}]) => {
            const {TabletStateInfo: tablets = []} = tabletsData;
            const TabletsMap = new Map();
            const {PathDescription = {}} = describe;
            const {
                TablePartitions = [],
                TablePartitionStats = [],
                TablePartitionMetrics = [],
            } = PathDescription;

            tablets.forEach((item) => {
                TabletsMap.set(item.TabletId, item);
            });

            TablePartitions.forEach((item, index) => {
                const metrics = Object.assign(
                    {},
                    TablePartitionStats[index],
                    TablePartitionMetrics[index],
                );
                TabletsMap.set(item.DatashardId, {
                    ...TabletsMap.get(item.DatashardId),
                    metrics,
                });
            });

            const preparedTablets = Array.from(TabletsMap.values());
            const selectMetrics =
                preparedTablets[0] &&
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

export function setHeatmapOptions(options) {
    return {
        type: SET_HEATMAP_OPTIONS,
        data: options,
    };
}

export default tablets;
