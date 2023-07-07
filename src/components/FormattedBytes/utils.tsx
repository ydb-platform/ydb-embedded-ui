import type {FormatBytesArgs} from '../../utils/bytesParsers';
import {FormattedBytes} from './FormattedBytes';

export const toFormattedSize = (
    value: number | string | undefined,
    params?: Omit<FormatBytesArgs, 'value'>,
) => {
    if (!value) {
        return null;
    }

    return <FormattedBytes value={value} significantDigits={2} {...params} />;
};
