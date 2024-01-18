import type {Reducer} from 'redux';

import type {TDomainKey} from '../../types/api/tablet';
import type {
    ITabletAction,
    ITabletDescribeHandledResponse,
    ITabletHandledResponse,
    ITabletPreparedHistoryItem,
    ITabletState,
} from '../../types/store/tablet';

import {createRequestActionTypes, createApiRequest} from '../utils';
import {prepareNodesMap} from '../../utils/nodes';

export const FETCH_TABLET = createRequestActionTypes('TABLET', 'FETCH_TABLET');
export const FETCH_TABLET_DESCRIBE = createRequestActionTypes('TABLET', 'FETCH_TABLET_DESCRIBE');

const CLEAR_TABLET_DATA = 'tablet/CLEAR_TABLET_DATA';

const initialState = {
    loading: false,
    tenantPath: undefined,
};

const tablet: Reducer<ITabletState, ITabletAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_TABLET.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_TABLET.SUCCESS: {
            const {tabletData, historyData} = action.data;
            const {TabletId: id} = tabletData;
            return {
                ...state,
                id,
                data: tabletData,
                history: historyData,
                loading: false,
                error: undefined,
            };
        }
        case FETCH_TABLET.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case FETCH_TABLET_DESCRIBE.SUCCESS: {
            const {tenantPath} = action.data;

            return {
                ...state,
                tenantPath,
                error: undefined,
            };
        }
        case CLEAR_TABLET_DATA: {
            return {
                ...state,
                id: undefined,
                tenantPath: undefined,
                data: undefined,
                history: undefined,
            };
        }
        default:
            return state;
    }
};

export const getTablet = (id: string) => {
    return createApiRequest({
        request: Promise.all([
            window.api.getTablet({id}),
            window.api.getTabletHistory({id}),
            window.api.getNodesList(),
        ]),
        actions: FETCH_TABLET,
        dataHandler: ([
            tabletResponseData,
            historyResponseData,
            nodesList,
        ]): ITabletHandledResponse => {
            const nodesMap = prepareNodesMap(nodesList);

            const historyData = Object.keys(historyResponseData).reduce<
                ITabletPreparedHistoryItem[]
            >((list, nodeId) => {
                const tabletInfo = historyResponseData[nodeId]?.TabletStateInfo;
                if (tabletInfo && tabletInfo.length) {
                    const leaderTablet = tabletInfo.find((t) => t.Leader) || tabletInfo[0];

                    const {ChangeTime, Generation, State, Leader, FollowerId} = leaderTablet;

                    const fqdn = nodesMap && nodeId ? nodesMap.get(Number(nodeId)) : undefined;

                    list.push({
                        nodeId,
                        generation: Generation,
                        changeTime: ChangeTime,
                        state: State,
                        leader: Leader,
                        followerId: FollowerId,
                        fqdn,
                    });
                }
                return list;
            }, []);

            const {TabletStateInfo = []} = tabletResponseData;
            const [tabletData = {}] = TabletStateInfo;

            return {tabletData, historyData};
        },
    });
};

export const getTabletDescribe = (tenantId: TDomainKey = {}) => {
    return createApiRequest({
        request: window.api.getTabletDescribe(tenantId),
        actions: FETCH_TABLET_DESCRIBE,
        dataHandler: (tabletDescribe): ITabletDescribeHandledResponse => {
            const {SchemeShard, PathId} = tenantId;
            const tenantPath = tabletDescribe.Path || `${SchemeShard}:${PathId}`;

            return {tenantPath};
        },
    });
};

export const clearTabletData = () => {
    return {
        type: CLEAR_TABLET_DATA,
    } as const;
};

export default tablet;
