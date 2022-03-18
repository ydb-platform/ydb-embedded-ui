import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';
import {stringifyVdiskId} from '../../utils';
import {createSelector} from 'reselect';

const FETCH_NODE = createRequestActionTypes('node', 'FETCH_NODE');
const FETCH_NODE_STRUCTURE = createRequestActionTypes('node', 'FETCH_NODE_STRUCTURE');
const RESET_NODE = 'node/RESET_NODE';

const node = (
    state = {
        data: {},
        loading: true,
        wasLoaded: false,
        nodeStructure: {},
        loadingStructure: true,
        wasLoadedStructure: false,
    },
    action,
) => {
    switch (action.type) {
        case FETCH_NODE.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_NODE.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_NODE.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case FETCH_NODE_STRUCTURE.REQUEST: {
            return {
                ...state,
                loadingStructure: true,
            };
        }
        case FETCH_NODE_STRUCTURE.SUCCESS: {
            return {
                ...state,
                nodeStructure: action.data,
                loadingStructure: false,
                wasLoadedStructure: true,
                errorStructure: undefined,
            };
        }
        case FETCH_NODE_STRUCTURE.FAILURE: {
            return {
                ...state,
                errorStructure: action.error,
                loadingStructure: false,
            };
        }
        case RESET_NODE: {
            return {
                ...state,
                data: {},
                wasLoaded: false,
                nodeStructure: {},
                wasLoadedStructure: false,
            };
        }
        default:
            return state;
    }
};

export const getNodeInfo = (id) => {
    return createApiRequest({
        request: window.api.getNodeInfo(id),
        actions: FETCH_NODE,
    });
};

export const getNodeStructure = (nodeId) => {
    return createApiRequest({
        request: window.api.getStorageInfo({nodeId}),
        actions: FETCH_NODE_STRUCTURE,
    });
};

export function resetNode() {
    return {
        type: RESET_NODE,
    };
}

const getNodeId = (state) => state.node?.data?.SystemStateInfo?.[0].NodeId;

const getRawNodeStructure = (state) => state.node?.nodeStructure;

export const selectNodeStructure = createSelector(
    [getNodeId, getRawNodeStructure],
    (nodeId, rawNodeStructure) => {
        const pools = rawNodeStructure?.StoragePools;
        const structure = {};
        pools?.forEach((pool) => {
            const groups = pool.Groups;
            groups?.forEach((group) => {
                const vDisks = group.VDisks?.filter((el) => el.NodeId === nodeId);
                vDisks?.forEach((vd) => {
                    const vDiskId = stringifyVdiskId(vd.VDiskId);
                    const pDiskId = vd.PDisk?.PDiskId;
                    if (!structure[String(pDiskId)]) {
                        structure[String(pDiskId)] = {vDisks: {}, ...vd.PDisk};
                    }
                    structure[String(pDiskId)].vDisks[vDiskId] = vd;
                });
            });
        });

        const structureWithVdisksArray = Object.keys(structure).reduce((acc, el) => {
            const vDisks = structure[el].vDisks;
            const vDisksArray = Object.keys(vDisks).reduce((acc, key, index) => {
                acc.push({...vDisks[key], id: key, order: index});
                return acc;
            }, []);
            acc[el] = {...structure[el], vDisks: vDisksArray};
            return acc;
        }, {});
        return structureWithVdisksArray;
    },
);

export default node;
