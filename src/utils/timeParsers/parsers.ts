import type {IProtobufTimeObject} from '../../types/api/common';
import {roundToPrecision} from '../dataFormatters/dataFormatters';
import {isNumeric} from '../utils';

import {parseProtobufDurationToMs, parseProtobufTimestampToMs} from './protobufParsers';

export const parseLag = (value: string | IProtobufTimeObject | undefined) =>
    value ? parseProtobufDurationToMs(value) : 0;

export const parseTimestampToIdleTime = (value: string | IProtobufTimeObject | undefined) => {
    if (!value) {
        return 0;
    }

    const duration = Date.now() - parseProtobufTimestampToMs(value);

    // Duration could be negative because of the difference between server and local time
    // Usually it below 100ms, so it could be omitted
    return duration < 0 ? 0 : duration;
};

export const parseUsToMs = (value: string | number | undefined, precision = 0) => {
    if (!value || !isNumeric(value)) {
        return 0;
    }

    return roundToPrecision(Number(value) / 1000, precision);
};
