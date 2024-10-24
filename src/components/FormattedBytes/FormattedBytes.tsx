import type {BytesSizes} from '../../utils/bytesParsers';
import {formatBytes} from '../../utils/bytesParsers';
import type {FormatValuesArgs} from '../../utils/bytesParsers/common';

type FormattedBytesProps = FormatValuesArgs<BytesSizes>;

export const FormattedBytes = ({value, withSpeedLabel, ...params}: FormattedBytesProps) => {
    const formatted = formatBytes({value, withSpeedLabel, ...params});
    const bytes = formatBytes({value, withSpeedLabel, size: 'b'});

    return <span title={bytes}>{formatted}</span>;
};
