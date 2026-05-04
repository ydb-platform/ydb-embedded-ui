import type {BytesSizes} from '../../../../../utils/bytesParsers';
import {sizes} from '../../../../../utils/bytesParsers';
import {EMPTY_DATA_PLACEHOLDER, UNBREAKABLE_GAP} from '../../../../../utils/constants';
import {formatNumber, formatPercent} from '../../../../../utils/dataFormatters/dataFormatters';
import {configuredNumeral} from '../../../../../utils/numeral';
import {formatMetricBytes} from '../../../../../utils/storageMetrics';
import i18n from '../i18n';

export function formatSummaryPercent(value: number) {
    const formattedValue = formatPercent(value / 100, 0);

    return value > 0 && formattedValue
        ? i18n('storage.new.used-percent', {value: formattedValue})
        : '';
}

export function formatSummaryMetricBytes(value?: string | number, size?: BytesSizes) {
    if (size !== 'tb') {
        return formatMetricBytes(value, size);
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const convertedValue = numericValue / sizes[size].value;
    const formattedValue = configuredNumeral(convertedValue).format('0,0.00');

    return formattedValue
        ? `${formattedValue}${UNBREAKABLE_GAP}${sizes[size].label}`
        : EMPTY_DATA_PLACEHOLDER;
}

export function formatOverheadValue(value?: number) {
    if (value === undefined || !Number.isFinite(value) || value <= 0) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    const precision = value >= 10 || Number.isInteger(value) ? 0 : 1;
    const normalizedValue = Number(value.toFixed(precision));

    return `${formatNumber(normalizedValue)}x`;
}
