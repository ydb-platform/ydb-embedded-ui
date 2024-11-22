import {isNumeric} from '../../../../../../utils/utils';

import {block} from './utils';

interface MetricsCellProps {
    value: unknown;
    formatter: (value: number) => string;
}

export function MetricsCell({value, formatter}: MetricsCellProps) {
    if (!isNumeric(value)) {
        return undefined;
    }

    const numberValue = Number(value);
    const content = formatter(numberValue);

    return <div className={block('metrics-cell')}>{content}</div>;
}
