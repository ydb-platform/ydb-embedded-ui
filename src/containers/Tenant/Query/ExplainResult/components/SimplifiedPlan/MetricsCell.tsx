import {isNumeric, toExponential} from '../../../../../../utils/utils';

import {block} from './utils';

interface MetricsCellProps {
    value: unknown;
}

export function MetricsCell({value}: MetricsCellProps) {
    if (!isNumeric(value)) {
        return undefined;
    }

    const numberValue = Number(value);
    const content =
        numberValue < 1e8 ? Math.round(numberValue).toLocaleString() : toExponential(value, 3);

    return <div className={block('metrics-cell')}>{content}</div>;
}
