import {formatBytes} from '../../utils/bytesParsers';
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

function formatChartValueToMs(value: ChartValue) {
    return formatToMs(roundToPrecision(convertToNumber(value), 2));
}

function formatChartValueToSize(value: ChartValue) {
    return formatBytes({value: convertToNumber(value), precision: 3});
}

// Numeric values expected, not numeric value should be displayd as 0
function convertToNumber(value: unknown): number {
    if (isNumeric(value)) {
        return Number(value);
    }

    return 0;
}
