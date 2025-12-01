import i18n from '../bytesParsers/i18n';
import {UNBREAKABLE_GAP} from '../constants';
import {isNumeric} from '../utils';

import type {FormatToSizeArgs, FormatValuesArgs} from './common';
import {formatNumber, roundToPrecision} from './dataFormatters';

const sizes = {
    noUnit: {
        value: 1,
        label: '',
    },
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

export const getNumberSizeUnit = (value: number) => {
    let size: Digits = 'noUnit';

    if (value >= sizes.thousand.value) {
        size = 'thousand';
    }
    if (value >= sizes.million.value) {
        size = 'million';
    }
    if (value >= sizes.billion.value) {
        size = 'billion';
    }
    if (value >= sizes.trillion.value) {
        size = 'trillion';
    }

    return size;
};

const formatToSize = ({value, size = 'thousand', precision = 0}: FormatToSizeArgs<Digits>) => {
    const result = roundToPrecision(Number(value) / sizes[size].value, precision);

    return formatNumber(result);
};

const addSizeLabel = (result: string, size: Digits, delimiter = UNBREAKABLE_GAP) => {
    const label = sizes[size].label;
    if (!label) {
        return result;
    }

    return result + delimiter + label;
};

export const formatNumberWithDigits = ({
    value,
    size,
    withSizeLabel = true,
    delimiter,
    ...params
}: FormatValuesArgs<Digits>) => {
    if (!isNumeric(value)) {
        return '';
    }

    const numValue = Number(value);

    const sizeToConvert = size ?? getNumberSizeUnit(numValue);

    const result = formatToSize({value: numValue, size: sizeToConvert, ...params});

    if (withSizeLabel) {
        return addSizeLabel(result, sizeToConvert, delimiter);
    }

    return result;
};
