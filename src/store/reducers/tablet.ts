import type {Reducer} from 'redux';

import type {TDomainKey} from '../../types/api/tablet';
import type {
    ITabletAction,
    ITabletDescribeHandledResponse,
    ITabletHandledResponse,
    ITabletPreparedHistoryItem,
    ITabletState,
} from '../../types/store/tablet';
import '../../services/api';

import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_TABLET = createRequestActionTypes('TABLET', 'FETCH_TABLET');
export const FETCH_TABLET_DESCRIBE = createRequestActionTypes('TABLET', 'FETCH_TABLET_DESCRIBE');

const initialState = {
    loading: false,
    tenantPath: '-',
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
        default:
            return state;
    }
};

export const getTablet = (id: string) => {
    return createApiRequest({
        request: Promise.all([window.api.getTablet({id}), window.api.getTabletHistory({id})]),
        actions: FETCH_TABLET,
        dataHandler: ([tabletResponseData, historyResponseData]): ITabletHandledResponse => {
            const historyData = Object.keys(historyResponseData).reduce<
                ITabletPreparedHistoryItem[]
            >((list, nodeId) => {
                const tabletInfo = historyResponseData[nodeId]?.TabletStateInfo;
                if (tabletInfo && tabletInfo.length) {
                    const leaderTablet = tabletInfo.find((t) => t.Leader) || tabletInfo[0];

                    const {ChangeTime, Generation, State, Leader, FollowerId} = leaderTablet;

                    list.push({
                        nodeId,
                        generation: Generation,
                        changeTime: ChangeTime,
                        state: State,
                        leader: Leader,
                        followerId: FollowerId,
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

export default tablet;
