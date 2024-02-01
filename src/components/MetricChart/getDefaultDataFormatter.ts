import {formatBytes} from '../../utils/bytesParsers';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {roundToPrecision} from '../../utils/dataFormatters/dataFormatters';
import {formatToMs} from '../../utils/timeParsers';
import {isNumeric} from '../../utils/utils';

import type {ChartDataType, ChartValue} from './types';

export const getDefaultDataFormatter = (dataType?: ChartDataType) => {
    switch (dataType) {
        case 'ms': {
            return formatChartValueToMs;
        }
        case 'size': {
            return formatChartValueToSize;
        }
        default:
            return undefined;
    }
};

// Values in y axis won't be null and will always be present and properly formatted
// EMPTY_DATA_PLACEHOLDER is actually empty data format for values in a tooltip
function formatChartValueToMs(value: ChartValue) {
    if (value === null) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    return formatToMs(roundToPrecision(convertToNumber(value), 2));
}

function formatChartValueToSize(value: ChartValue) {
    if (value === null) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    return formatBytes({value: convertToNumber(value), precision: 3});
}

// Numeric values expected, not numeric value should be displayd as 0
function convertToNumber(value: unknown): number {
    if (isNumeric(value)) {
        return Number(value);
    }

    return 0;
}
