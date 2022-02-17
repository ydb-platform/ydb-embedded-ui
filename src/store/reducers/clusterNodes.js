import {createRequestActionTypes, createApiRequest} from '../utils';
import {createSelector} from 'reselect';
import '../../services/api';
import {ALL} from '../../utils/constants';

const FETCH_NODES_LIST = createRequestActionTypes('tenants', 'FETCH_NODES_LIST');

const initialState = {loading: true, wasLoaded: false, data: []};

const nodesList = function (state = initialState, action) {
    switch (action.type) {
        case FETCH_NODES_LIST.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_NODES_LIST.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_NODES_LIST.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        default:
            return state;
    }
};

export function getNodesList() {
    return createApiRequest({
        request: window.api.getNodeInfo(),
        actions: FETCH_NODES_LIST,
        dataHandler: (data) => {
            const {SystemStateInfo: nodes = []} = data;
            return nodes;
        },
    });
}

export const getFilteredNodes = createSelector(
    (state) => state.nodes.data?.Tenants,
    (state) => state.settings.problemFilter,
    (tenants, filter) => {
        const nodes = tenants?.reduce((acc, item) => {
            if (Array.isArray(item.Nodes)) {
                return [...acc, ...item.Nodes.map((node) => ({...node, TenantName: item.Name}))];
            }
            return acc;
        }, []);
        if (filter === ALL) {
            return nodes;
        }

        return nodes.filter(({Overall}) => {
            return Overall && Overall !== 'Green';
        });
    },
);

export default nodesList;
