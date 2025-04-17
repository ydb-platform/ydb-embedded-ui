import {formatBytes} from '../../utils/bytesParsers';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {roundToPrecision} from '../../utils/dataFormatters/dataFormatters';
import {formatToMs} from '../../utils/timeParsers';
import {safeParseNumber} from '../../utils/utils';

import type {ChartDataType, ChartValue} from './types';

export const getDefaultDataFormatter = (dataType?: ChartDataType) => {
    switch (dataType) {
        case 'ms': {
            return formatChartValueToMs;
        }
        case 'size': {
            return formatChartValueToSize;
        }
        case 'percent': {
            return formatChartValueToPercent;
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
    return formatToMs(roundToPrecision(safeParseNumber(value), 2));
}

function formatChartValueToSize(value: ChartValue) {
    if (value === null) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    return formatBytes({value: safeParseNumber(value), precision: 3});
}
function formatChartValueToPercent(value: ChartValue) {
    if (value === null) {
        return EMPTY_DATA_PLACEHOLDER;
    }
    return Math.round(safeParseNumber(value) * 100) + '%';
}
