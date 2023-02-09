import {GIGABYTE, KILOBYTE, MEGABYTE} from '../constants';
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
};

export type IBytesSizes = keyof typeof sizes;

interface FormatBytesArgs {
    value: number | string | undefined;
    size?: IBytesSizes;
    precision?: number;
    withLabel?: boolean;
    isSpeed?: boolean;
}

export const formatBytesCustom = ({
    value,
    size = 'mb',
    precision = 0,
    withLabel = true,
    isSpeed = false,
}: FormatBytesArgs) => {
    if (!isNumeric(value)) {
        return '';
    }

    let result = (Number(value) / sizes[size].value).toFixed(precision);

    if (withLabel) {
        result += ` ${sizes[size].label}`;

        if (isSpeed) {
            result += i18n('perSecond');
        }
    }

    return result;
};
