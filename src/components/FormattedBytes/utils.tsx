import type {BytesSizes} from '../../utils/bytesParsers';
import type {FormatValuesArgs} from '../../utils/dataFormatters/common';

import {FormattedBytes} from './FormattedBytes';

export const toFormattedSize = (
    value: number | string | undefined,
    params?: Omit<FormatValuesArgs<BytesSizes>, 'value'>,
) => {
    if (!value) {
        return null;
    }

    return <FormattedBytes value={value} {...params} />;
};
