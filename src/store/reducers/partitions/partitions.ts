import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {api} from '../api';

import {prepareConsumerPartitions, prepareTopicPartitions} from './utils';

const initialState: {
    selectedConsumer?: string;
} = {};

const slice = createSlice({
    name: 'partitions',
    initialState,
    reducers: {
        setSelectedConsumer: (state, action: PayloadAction<string | undefined>) => {
            state.selectedConsumer = action.payload;
        },
    },
});

export const {setSelectedConsumer} = slice.actions;
export default slice.reducer;

export const partitionsApi = api.injectEndpoints({
    endpoints: (build) => ({
        getPartitions: build.query({
            queryFn: async (
                {
                    path,
                    database,
                    consumerName,
                    databaseFullPath,
                    useMetaProxy,
                }: {
                    path: string;
                    database: string;
                    consumerName?: string;
                    databaseFullPath: string;
                    useMetaProxy?: boolean;
                },
                {signal},
            ) => {
                try {
                    if (consumerName) {
                        const response = await window.api.viewer.getConsumer(
                            {
                                path: {path, databaseFullPath, useMetaProxy},
                                database,
                                consumer: consumerName,
                            },
                            {signal},
                        );
                        const rawPartitions = response.partitions;
                        const data = prepareConsumerPartitions(rawPartitions);
                        return {data};
                    } else {
                        const response = await window.api.viewer.getTopic(
                            {path: {path, databaseFullPath, useMetaProxy}, database},
                            {signal},
                        );
                        const rawPartitions = response.partitions;
                        const data = prepareTopicPartitions(rawPartitions);
                        return {data};
                    }
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
