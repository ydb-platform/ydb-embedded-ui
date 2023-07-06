import {FormatBytesArgs, formatBytes} from '../../utils/bytesParsers';

type FormattedBytesProps = FormatBytesArgs;

export const FormattedBytes = ({value, withSpeedLabel, ...params}: FormattedBytesProps) => {
    const formatted = formatBytes({value, withSpeedLabel, ...params});
    const bytes = formatBytes({value, withSpeedLabel, size: 'b'});

    return <span title={bytes}>{formatted}</span>;
};
