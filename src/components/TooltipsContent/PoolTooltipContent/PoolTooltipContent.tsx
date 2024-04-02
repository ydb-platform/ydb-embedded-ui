import type {TPoolStats} from '../../../types/api/nodes';
import {InfoViewer, createInfoFormatter, formatObject} from '../../InfoViewer';

const formatPool = createInfoFormatter<TPoolStats>({
    values: {
        Usage: (value) => value && `${(Number(value) * 100).toFixed(2)} %`,
    },
    labels: {
        Name: 'Pool',
    },
    defaultValueFormatter: (value) => value && String(value),
});

interface PoolTooltipContentProps {
    data?: TPoolStats;
    className?: string;
}

export const PoolTooltipContent = ({data = {}, className}: PoolTooltipContentProps) => {
    const info = formatObject(formatPool, data);

    return <InfoViewer className={className} info={info} dots={false} size={'s'} />;
};
