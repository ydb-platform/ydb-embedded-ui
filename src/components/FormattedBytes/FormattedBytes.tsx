import {FormatBytesArgs, formatBytes} from '../../utils/bytesParsers';

type FormattedBytesProps = FormatBytesArgs;

export const FormattedBytes = ({value, isSpeed, ...params}: FormattedBytesProps) => {
    const formatted = formatBytes({value, isSpeed, ...params});
    const bytes = formatBytes({value, isSpeed, size: 'b'});

    return <span title={bytes}>{formatted}</span>;
};
