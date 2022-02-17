import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_VDISK = createRequestActionTypes('VDISK', 'FETCH_VDISK');

const initialState = {loading: true, wasLoaded: false, data: undefined};

const vdisk = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_VDISK.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_VDISK.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_VDISK.FAILURE: {
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

export const getVdiskInfo = ({vdiskId, pdiskId, nodeId}) => {
    return createApiRequest({
        request: window.api.getVdiskInfo({vdiskId, pdiskId, nodeId}),
        actions: FETCH_VDISK,
    });
};

export default vdisk;
