import type {NbsListParams} from '../../../types/api/nbs';
import type {NodesRequestParams} from '../../../types/api/nodes';
import type {GroupsRequestParams} from '../../../types/api/storage';
import {getDatacenterQueryContext} from '../../datacenterQueryContext';
import {api} from '../api';

import {getTabletGroups} from './getNbsTabletGroups';
import {requestStorageData} from './requestStorageData';
import {prepareStorageNodesResponse} from './utils';

interface StorageClusterContext {
    backend?: string;
    clusterName?: string;
    environment?: string;
}

export const storageApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getNbsStorageConfiguration: builder.query({
            queryFn: async (_context: StorageClusterContext, {signal}) => {
                try {
                    return {data: await window.api.storage.getNbsStorageConfiguration({signal})};
                } catch (error) {
                    return {error};
                }
            },
        }),
        getNbsTabletDetails: builder.query({
            queryFn: async ({tabletId}: StorageClusterContext & {tabletId: string}, {signal}) => {
                try {
                    return {data: await getTabletGroups(tabletId, signal)};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All', 'StorageData'],
        }),
        getNbsStorageGroups: builder.query({
            queryFn: async (
                {
                    view,
                    params,
                }: StorageClusterContext & {
                    view: 'tablets' | 'disks';
                    params: NbsListParams;
                },
                {signal},
            ) => {
                try {
                    const data = await window.api.storage.getNbsStorage(
                        view,
                        {...params, groups_only: true},
                        {signal},
                    );
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All', 'StorageData'],
        }),
        getStorageNodesInfo: builder.query({
            queryFn: async (params: Omit<NodesRequestParams, 'type'>, {signal, getState}) => {
                const meta = getDatacenterQueryContext(getState);
                try {
                    const result = await window.api.viewer.getNodes(
                        {storage: true, type: 'static', ...params},
                        {signal},
                    );
                    return {data: prepareStorageNodesResponse(result), meta};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All', 'StorageData'],
        }),
        getStorageGroupsInfo: builder.query({
            queryFn: async (params: GroupsRequestParams, {signal}) => {
                try {
                    const result = await requestStorageData(params, {signal});
                    return {data: result};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All', 'StorageData'],
        }),
    }),
    overrideExisting: 'throw',
});
