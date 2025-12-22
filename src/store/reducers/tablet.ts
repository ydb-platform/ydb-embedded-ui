import type {TDomainKey} from '../../types/api/tablet';
import type {ITabletPreparedHistoryItem} from '../../types/store/tablet';
import {prepareNodesMap} from '../../utils/nodes';

import {api} from './api';

export const tabletApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTablet: build.query({
            queryFn: async (
                {
                    id,
                    database,
                    followerId,
                }: {id: string; database?: string; nodeId?: string; followerId?: string},
                {signal},
            ) => {
                try {
                    const [tabletResponseData, historyResponseData, nodesList] = await Promise.all([
                        window.api.viewer.getTablet({id, database, followerId}, {signal}),
                        window.api.viewer.getTabletHistory({id, database}, {signal}),
                        window.api.viewer.getNodesList({database}, {signal}),
                    ]);
                    const nodeHostsMap = prepareNodesMap(nodesList);

                    const historyData = Object.keys(historyResponseData).reduce<
                        ITabletPreparedHistoryItem[]
                    >((list, nodeId) => {
                        const tabletInfo = historyResponseData[nodeId]?.TabletStateInfo;

                        tabletInfo?.forEach((tablet) => {
                            const {ChangeTime, Generation, State, Leader, FollowerId} = tablet;

                            const fqdn =
                                nodeHostsMap && nodeId
                                    ? nodeHostsMap.get(Number(nodeId))?.Host
                                    : undefined;

                            list.push({
                                nodeId,
                                generation: Generation,
                                changeTime: ChangeTime,
                                state: State,
                                leader: Leader,
                                followerId: FollowerId,
                                fqdn,
                            });
                        });
                        return list;
                    }, []);

                    const {TabletStateInfo = []} = tabletResponseData;
                    const tabletData =
                        followerId === undefined
                            ? TabletStateInfo.find((t) => t.Leader)
                            : TabletStateInfo.find((t) => t.FollowerId?.toString() === followerId);

                    const {TabletId} = tabletData || {};

                    return {data: {id: TabletId, data: tabletData, history: historyData}};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: (_result, _error, arg) => {
                return ['All', {type: 'Tablet', id: arg.id}];
            },
        }),
        getTabletDescribe: build.query({
            queryFn: async (
                {tenantId, database}: {tenantId: TDomainKey; database?: string},
                {signal},
            ) => {
                try {
                    const tabletDescribe = await window.api.viewer.getTabletDescribe(
                        tenantId,
                        database,
                        {
                            signal,
                        },
                    );
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
            queryFn: async ({id, hiveId}: {id: string; hiveId: string}, {signal}) => {
                try {
                    const tabletResponseData = await window.api.tablets.getTabletFromHive(
                        {id, hiveId},
                        {signal},
                    );

                    return {data: tabletResponseData};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: (_result, _error, arg) => {
                return ['All', {type: 'Tablet', id: arg.id}];
            },
        }),
        killTablet: build.mutation({
            queryFn: async ({id}: {id: string}) => {
                try {
                    const data = await window.api.tablets.killTablet(id);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            invalidatesTags: (_result, _error, arg) => {
                return [
                    {type: 'Tablet', id: arg.id},
                    {type: 'Tablet', id: 'LIST'},
                ];
            },
        }),
        stopTablet: build.mutation({
            queryFn: async ({id, hiveId}: {id: string; hiveId: string}) => {
                try {
                    const data = await window.api.tablets.stopTablet(id, hiveId);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            invalidatesTags: (_result, _error, arg) => {
                return [
                    {type: 'Tablet', id: arg.id},
                    {type: 'Tablet', id: 'LIST'},
                ];
            },
        }),
        resumeTablet: build.mutation({
            queryFn: async ({id, hiveId}: {id: string; hiveId: string}) => {
                try {
                    const data = await window.api.tablets.resumeTablet(id, hiveId);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            invalidatesTags: (_result, _error, arg) => {
                return [
                    {type: 'Tablet', id: arg.id},
                    {type: 'Tablet', id: 'LIST'},
                ];
            },
        }),
    }),
    overrideExisting: 'throw',
});
