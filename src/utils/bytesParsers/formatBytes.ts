import {GIGABYTE, KILOBYTE, MEGABYTE, TERABYTE, UNBREAKABLE_GAP} from '../constants';
import type {FormatToSizeArgs, FormatValuesArgs} from '../dataFormatters/common';
import {formatNumber, roundToPrecision} from '../dataFormatters/dataFormatters';
import {isNumeric} from '../utils';

import i18n from './i18n';

const sizes = {
    b: {
        value: 1,
        label: i18n('b'),
    },
    kb: {
        value: KILOBYTE,
        label: i18n('kb'),
    },
    mb: {
        value: MEGABYTE,
        label: i18n('mb'),
    },
    gb: {
        value: GIGABYTE,
        label: i18n('gb'),
    },
    tb: {
        value: TERABYTE,
        label: i18n('tb'),
    },
} as const;

export type BytesSizes = keyof typeof sizes;

export const getBytesSizeUnit = (value: number) => {
    let size: BytesSizes = 'b';

    if (value >= sizes.kb.value) {
        size = 'kb';
    }
    if (value >= sizes.mb.value) {
        size = 'mb';
    }
    if (value >= sizes.gb.value) {
        size = 'gb';
    }
    if (value >= sizes.tb.value) {
        size = 'tb';
    }

    return size;
};

const formatToSize = ({value, size = 'mb', precision = 0}: FormatToSizeArgs<BytesSizes>) => {
    const result = roundToPrecision(Number(value) / sizes[size].value, precision);

    return formatNumber(result);
};

const addSizeLabel = (result: string, size: BytesSizes, delimiter = UNBREAKABLE_GAP) => {
    return result + delimiter + sizes[size].label;
};

const addSpeedLabel = (result: string, size: BytesSizes) => {
    return addSizeLabel(result, size) + i18n('perSecond');
};

export const formatBytes = ({
    value,
    size,
    withSpeedLabel = false,
    withSizeLabel = true,
    delimiter,
    ...params
}: FormatValuesArgs<BytesSizes>) => {
    if (!isNumeric(value)) {
        return '';
    }

    const numValue = Number(value);

    const sizeToConvert = size ?? getBytesSizeUnit(numValue);

    const result = formatToSize({value: numValue, size: sizeToConvert, ...params});

    if (withSpeedLabel) {
        return addSpeedLabel(result, sizeToConvert);
    }

    if (withSizeLabel) {
        return addSizeLabel(result, sizeToConvert, delimiter);
    }

    return result;
};
