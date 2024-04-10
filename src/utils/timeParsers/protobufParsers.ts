import type {IProtobufTimeObject} from '../../types/api/common';
import {MS_IN_NANOSECONDS} from '../constants';

/**
 * Parses Google.protobuf Duration and Timestamp represented by objects
 */
export const parseProtobufTimeObjectToMs = (value: IProtobufTimeObject): number => {
    const secondsInMs = value.seconds ? Number(value.seconds) * 1000 : 0;
    const nanosecondsInMs = value.nanos ? value.nanos / MS_IN_NANOSECONDS : 0;
    return secondsInMs + nanosecondsInMs;
};

/**
 * Parses Google.protobuf Timestamp to ms.
 * Timestamp could be represented as object or as date string
 */
export const parseProtobufTimestampToMs = (value: string | IProtobufTimeObject) => {
    if (typeof value === 'string') {
        return Date.parse(value);
    } else {
        return parseProtobufTimeObjectToMs(value);
    }
};

/**
 * Parses Google.protobuf Duration to ms.
 * Duration could be represented as object or as string with format '12345s'
 */
export const parseProtobufDurationToMs = (value: string | IProtobufTimeObject) => {
    if (typeof value === 'string') {
        return parseInt(value, 10) * 1000;
    } else {
        return parseProtobufTimeObjectToMs(value);
    }
};
