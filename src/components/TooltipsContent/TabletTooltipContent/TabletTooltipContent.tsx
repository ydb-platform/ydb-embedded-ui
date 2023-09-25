import type {TTabletStateInfo} from '../../../types/api/tablet';

import {calcUptime} from '../../../utils/dataFormatters/dataFormatters';
import {InfoViewer, createInfoFormatter, formatObject} from '../../InfoViewer';

const formatTablet = createInfoFormatter<TTabletStateInfo>({
    values: {
        ChangeTime: (value) => calcUptime(value),
    },
    labels: {
        TabletId: 'Tablet',
    },
    defaultValueFormatter: (value) => value && String(value),
});

interface TabletTooltipContentProps {
    data?: TTabletStateInfo;
    className?: string;
}

export const TabletTooltipContent = ({data = {}, className}: TabletTooltipContentProps) => {
    const {TabletId, NodeId, State, Type, ChangeTime, Generation} = data;

    const info = formatObject(formatTablet, {
        TabletId,
        NodeId,
        State,
        Type,
        ChangeTime,
        Generation,
    });

    return <InfoViewer className={className} info={info} dots={false} size={'s'} />;
};
