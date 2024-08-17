import type {TDomainKey} from '../../types/api/tablet';
import type {ITabletPreparedHistoryItem} from '../../types/store/tablet';
import {prepareNodesMap} from '../../utils/nodes';

import {api} from './api';

export const tabletApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTablet: build.query({
            queryFn: async ({id, database}: {id: string; database?: string}, {signal}) => {
                try {
                    const [tabletResponseData, historyResponseData, nodesList] = await Promise.all([
                        window.api.getTablet({id, database}, {signal}),
                        window.api.getTabletHistory({id, database}, {signal}),
                        window.api.getNodesList({signal, database}),
                    ]);
                    const nodesMap = prepareNodesMap(nodesList);

                    const historyData = Object.keys(historyResponseData).reduce<
                        ITabletPreparedHistoryItem[]
                    >((list, nodeId) => {
                        const tabletInfo = historyResponseData[nodeId]?.TabletStateInfo;
                        if (tabletInfo && tabletInfo.length) {
                            const leaderTablet = tabletInfo.find((t) => t.Leader) || tabletInfo[0];

                            const {ChangeTime, Generation, State, Leader, FollowerId} =
                                leaderTablet;

                            const fqdn =
                                nodesMap && nodeId ? nodesMap.get(Number(nodeId)) : undefined;

                            if (State !== 'Dead') {
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
                        }
                        return list;
                    }, []);

                    const {TabletStateInfo = []} = tabletResponseData;
                    const [tabletData = {}] = TabletStateInfo;
                    const {TabletId} = tabletData;

                    return {data: {id: TabletId, data: tabletData, history: historyData}};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        getTabletDescribe: build.query({
            queryFn: async ({tenantId}: {tenantId: TDomainKey}, {signal}) => {
                try {
                    const tabletDescribe = await window.api.getTabletDescribe(tenantId, {signal});
                    const {SchemeShard, PathId} = tenantId;
                    const tenantPath = tabletDescribe?.Path || `${SchemeShard}:${PathId}`;

                    return {data: tenantPath};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        getAdvancedTableInfo: build.query({
            queryFn: async ({id, hiveId}: {id: string; hiveId?: string}, {signal}) => {
                try {
                    const tabletResponseData = await window.api.getTabletFromHive(
                        {id, hiveId},
                        {signal},
                    );

                    return {data: tabletResponseData};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
