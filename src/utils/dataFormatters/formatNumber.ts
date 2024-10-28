import i18n from '../bytesParsers/i18n';
import {UNBREAKABLE_GAP, isNumeric} from '../utils';

import type {FormatToSizeArgs, FormatValuesArgs} from './common';
import {formatNumber, roundToPrecision} from './dataFormatters';

const sizes = {
    thousand: {
        value: 1_000,
        label: i18n('label_thousand'),
    },
    million: {
        value: 1_000_000,
        label: i18n('label_million'),
    },
    billion: {
        value: 1_000_000_000,
        label: i18n('label_billion'),
    },
    trillion: {
        value: 1_000_000_000_000,
        label: i18n('label_trillion'),
    },
};

export type Digits = keyof typeof sizes;

/**
 * This function is needed to keep more than 3 digits of the same size.
 *
 * @param significantDigits - number of digits above 3
 * @returns size to format value to get required number of digits
 *
 * By default value converted to the next size when it's above 1000,
 * so we have 900k and 1m. To extend it additional significantDigits could be set
 *
 * significantDigits value added above default 3
 *
 * significantDigits = 1 - 9 000k and 10m
 *
 * significantDigits = 2 - 90 000m and 100b
 *
 * significantDigits = 3 - 900 000b and 1000t
 */
export const getNumberWithSignificantDigits = (value: number, significantDigits: number) => {
    const multiplier = 10 ** significantDigits;

    const thousandLevel = sizes.thousand.value * multiplier;
    const millionLevel = sizes.million.value * multiplier;
    const billionLevel = sizes.billion.value * multiplier;
    const trillionLevel = sizes.trillion.value * multiplier;

    let size: Digits = 'thousand';

    if (value > thousandLevel) {
        size = 'thousand';
    }
    if (value >= millionLevel) {
        size = 'million';
    }
    if (value >= billionLevel) {
        size = 'billion';
    }
    if (value >= trillionLevel) {
        size = 'trillion';
    }

    return size;
};

const formatToSize = ({value, size = 'thousand', precision = 0}: FormatToSizeArgs<Digits>) => {
    const result = roundToPrecision(Number(value) / sizes[size].value, precision);

    return formatNumber(result);
};

const addSizeLabel = (result: string, size: Digits, delimiter = UNBREAKABLE_GAP) => {
    return result + delimiter + sizes[size].label;
};

/**
 * @param significantDigits - number of digits above 3
 */
export const formatNumberWithDigits = ({
    value,
    size,
    withSizeLabel = true,
    significantDigits = 0,
    delimiter,
    ...params
}: FormatValuesArgs<Digits>) => {
    if (!isNumeric(value)) {
        return '';
    }

    const numValue = Number(value);

    const sizeToConvert = size ?? getNumberWithSignificantDigits(numValue, significantDigits);

    const result = formatToSize({value: numValue, size: sizeToConvert, ...params});

    if (withSizeLabel) {
        return addSizeLabel(result, sizeToConvert, delimiter);
    }

    return result;
};
