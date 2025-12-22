import {createSelector, lruMemoize} from '@reduxjs/toolkit';
import isEqual from 'lodash/isEqual';

import type {TTabletStateInfo} from '../../types/api/tablet';
import type {TabletsApiRequestParams} from '../../types/store/tablets';
import type {RootState} from '../defaultStore';

import {api} from './api';
import {selectNodesMap} from './nodesList';

export const tabletsApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTabletsInfo: build.query({
            queryFn: async (params: TabletsApiRequestParams, {signal}) => {
                try {
                    const data = await window.api.viewer.getTabletsInfo(params, {signal});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All', {type: 'Tablet', id: 'LIST'}],
        }),
    }),
    overrideExisting: 'throw',
});

const getTabletsInfoSelector = createSelector(
    (params: TabletsApiRequestParams) => params,
    (params) => tabletsApi.endpoints.getTabletsInfo.select(params),
    {
        argsMemoize: lruMemoize,
        argsMemoizeOptions: {equalityCheck: isEqual},
    },
);

const selectGetTabletsInfo = createSelector(
    (state: RootState) => state,
    (_state: RootState, params: TabletsApiRequestParams) => getTabletsInfoSelector(params),
    (state, selectTabletsInfo) => selectTabletsInfo(state).data,
);

export const selectTabletsWithFqdn = createSelector(
    (state: RootState, params: TabletsApiRequestParams) => selectGetTabletsInfo(state, params),
    (state: RootState, params: TabletsApiRequestParams) => selectNodesMap(state, params.database),
    (data, nodeHostsMap): (TTabletStateInfo & {fqdn?: string})[] => {
        if (!data?.TabletStateInfo) {
            return [];
        }
        if (!nodeHostsMap) {
            return data.TabletStateInfo;
        }
        return data.TabletStateInfo.map((tablet) => {
            const fqdn =
                tablet.NodeId === undefined ? undefined : nodeHostsMap.get(tablet.NodeId)?.Host;
            return {...tablet, fqdn};
        });
    },
);
