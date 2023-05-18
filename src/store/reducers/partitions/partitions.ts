import type {Reducer} from 'redux';

import '../../../services/api';

import {createRequestActionTypes, createApiRequest} from '../../utils';

import type {PartitionsAction, PartitionsState} from './types';
import {prepareConsumerPartitions, prepareTopicPartitions} from './utils';

export const FETCH_PARTITIONS = createRequestActionTypes('partitions', 'FETCH_PARTITIONS');

const SET_SELECTED_CONSUMER = 'partitions/SET_SELECTED_CONSUMER';
const SET_DATA_WAS_NOT_LOADED = 'partitions/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: false,
    wasLoaded: false,
    selectedConsumer: undefined,
};

const partitions: Reducer<PartitionsState, PartitionsAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_PARTITIONS.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_PARTITIONS.SUCCESS: {
            return {
                ...state,
                partitions: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_PARTITIONS.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case SET_SELECTED_CONSUMER: {
            return {
                ...state,
                selectedConsumer: action.data,
            };
        }
        case SET_DATA_WAS_NOT_LOADED: {
            return {
                ...state,
                wasLoaded: false,
            };
        }
        default:
            return state;
    }
};

export const setSelectedConsumer = (value?: string) => {
    return {
        type: SET_SELECTED_CONSUMER,
        data: value,
    } as const;
};

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};

export function getPartitions(path: string, consumerName?: string) {
    if (consumerName) {
        return createApiRequest({
            request: window.api.getConsumer(
                {path, consumer: consumerName},
                {concurrentId: 'getPartitions'},
            ),
            actions: FETCH_PARTITIONS,
            dataHandler: (data) => {
                const rawPartitions = data.partitions;
                return prepareConsumerPartitions(rawPartitions);
            },
        });
    }

    return createApiRequest({
        request: window.api.getTopic({path}, {concurrentId: 'getPartitions'}),
        actions: FETCH_PARTITIONS,
        dataHandler: (data) => {
            const rawPartitions = data.partitions;
            return prepareTopicPartitions(rawPartitions);
        },
    });
}

export default partitions;
