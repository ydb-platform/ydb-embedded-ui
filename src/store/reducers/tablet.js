import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';
import _ from 'lodash';

const FETCH_TABLET = createRequestActionTypes('TABLET', 'FETCH_TABLET');
const FETCH_TABLET_DESCRIBE = createRequestActionTypes('TABLET', 'FETCH_TABLET_DESCRIBE');

const tablet = (state = {loading: false, tenantPath: '-'}, action) => {
    switch (action.type) {
        case FETCH_TABLET.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_TABLET.SUCCESS: {
            const {tablet, history} = action.data;
            const {TabletId: id} = tablet;
            return {
                ...state,
                id,
                data: tablet,
                history,
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

export const getTablet = (id) => {
    return createApiRequest({
        request: Promise.all([window.api.getTablet({id}), window.api.getTabletHistory({id})]),
        actions: FETCH_TABLET,
        dataHandler: ([tabletData, history]) => {
            const historyData = Object.keys(history).reduce((list, nodeId) => {
                const tabletInfo = history[nodeId]?.TabletStateInfo;
                if (tabletInfo && tabletInfo.length) {
                    const leaderTablet =
                        _.find(tabletInfo, (t) => t.Master || t.Leader) || tabletInfo[0];
                    const {ChangeTime, Generation, State, Master, SlaveId, Leader, FollowerId} =
                        leaderTablet;
                    list.push({
                        nodeId,
                        generation: Generation,
                        changeTime: ChangeTime,
                        state: State,
                        leader: Master || Leader,
                        followerId: SlaveId || FollowerId,
                    });
                }
                return list;
            }, []);

            const {TabletStateInfo = []} = tabletData;
            const [tablet = {}] = TabletStateInfo;

            return {tablet, history: historyData};
        },
    });
};

export const getTabletDescribe = (TenantId) => {
    return createApiRequest({
        request: window.api.getTabletDescribe(TenantId),
        actions: FETCH_TABLET_DESCRIBE,
        dataHandler: (tabletDescribe) => {
            const {SchemeShard, PathId} = TenantId;
            const tenantPath = tabletDescribe.Path || `${SchemeShard}:${PathId}`;

            return {tenantPath};
        },
    });
};

export default tablet;
