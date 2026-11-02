import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {getHealthStatusNow} from '../../../utils/healthStatus/healthClock';
import {prepareHealthStatus} from '../../../utils/healthStatus/healthStatus';
import type {GetState} from '../../defaultStore';
import {api} from '../api';
import {queryMetaCapability} from '../capabilities/capabilities';
import {CLUSTER_DATA_LIST_TAG} from '../entityDataTags';

import type {ClustersFilters} from './types';
import {prepareClustersData} from './utils';

const initialState: ClustersFilters = {
    availability: ['available'],
    clusterName: '',
    status: [],
    service: [],
    version: [],
    galaxy: [],
};

const slice = createSlice({
    name: 'clusters',
    initialState,
    reducers: {
        changeClustersFilters: (state, action: PayloadAction<Partial<ClustersFilters>>) => ({
            ...state,
            ...action.payload,
        }),
    },
});

export default slice.reducer;
export const {changeClustersFilters} = slice.actions;

export const clustersApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getClustersList: builder.query({
            queryFn: async (_, {signal, dispatch, getState}) => {
                try {
                    if (window.api.meta) {
                        const requestStartedAt = getHealthStatusNow();
                        const data = await window.api.meta.getClustersList(undefined, {signal});
                        const version = await queryMetaCapability('/meta/clusters', {
                            dispatch,
                            getState: getState as GetState,
                        });
                        return {
                            data: prepareClustersData(data).map((cluster) => ({
                                ...cluster,
                                cluster: cluster.cluster
                                    ? prepareHealthStatus(
                                          cluster.cluster,
                                          requestStartedAt,
                                          version,
                                      )
                                    : undefined,
                            })),
                        };
                    } else {
                        throw new Error('Method is not implemented.');
                    }
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All', CLUSTER_DATA_LIST_TAG],
        }),
    }),
    overrideExisting: 'throw',
});
