import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {api} from '../api';

import type {PartitionsState} from './types';
import {prepareConsumerPartitions, prepareTopicPartitions} from './utils';

const initialState: PartitionsState = {
    selectedConsumer: '',
};

const slice = createSlice({
    name: 'partitions',
    initialState,
    reducers: {
        setSelectedConsumer: (state, action: PayloadAction<string>) => {
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
                {path, consumerName}: {path: string; consumerName?: string},
                {signal},
            ) => {
                try {
                    if (consumerName) {
                        const response = await window.api.getConsumer(
                            {path, consumer: consumerName},
                            {signal},
                        );
                        const rawPartitions = response.partitions;
                        const data = prepareConsumerPartitions(rawPartitions);
                        return {data};
                    } else {
                        const response = await window.api.getTopic({path}, {signal});
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
