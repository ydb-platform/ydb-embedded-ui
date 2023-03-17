import type {Reducer} from 'redux';

import type {NodesListState, NodesListAction} from '../../types/store/nodesList';
import '../../services/api';
import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_NODES_LIST = createRequestActionTypes('nodesList', 'FETCH_NODES_LIST');

const initialState = {loading: true, wasLoaded: false, data: []};

const nodesList: Reducer<NodesListState, NodesListAction> = (state = initialState, action) => {
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

export default nodesList;
