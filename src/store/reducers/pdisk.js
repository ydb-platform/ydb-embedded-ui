import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_PDISK = createRequestActionTypes('PDISK', 'FETCH_PDISK');

const initialState = {loading: true, wasLoaded: false, data: undefined};

const pdisk = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_PDISK.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_PDISK.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_PDISK.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }

        case 'CLEAR_STORE': {
            return initialState;
        }

        default:
            return state;
    }
};

export const clearStore = () => ({type: 'CLEAR_STORE'});

export const getPdiskInfo = (nodeId, pdiskId) => {
    return createApiRequest({
        request: window.api.getPdiskInfo(nodeId, pdiskId),
        actions: FETCH_PDISK,
    });
};

export default pdisk;
