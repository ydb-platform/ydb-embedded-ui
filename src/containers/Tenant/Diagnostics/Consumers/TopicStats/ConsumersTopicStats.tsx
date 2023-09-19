import block from 'bem-cn-lite';

import type {IPreparedTopicStats} from '../../../../../types/store/topic';
import {formatMsToUptime} from '../../../../../utils/dataFormatters/dataFormatters';
import {SpeedMultiMeter} from '../../../../../components/SpeedMultiMeter';

import './ConsumersTopicStats.scss';

const b = block('ydb-diagnostics-consumers-topic-stats');

interface ConsumersTopicStatsProps {
    data?: IPreparedTopicStats;
}

export const ConsumersTopicStats = ({data}: ConsumersTopicStatsProps) => {
    const {writeSpeed, partitionsWriteLag, partitionsIdleTime} = data || {};

    const values = [
        {
            label: 'Write speed',
            value: <SpeedMultiMeter data={writeSpeed} />,
        },
        {
            label: 'Write lag',
            value: formatMsToUptime(partitionsWriteLag || 0),
        },
        {
            label: 'Write idle time',
            value: formatMsToUptime(partitionsIdleTime || 0),
        },
    ];

    return (
        <div className={b('wrapper')}>
            {values.map((value, index) => (
                <div key={index} className={b('item')}>
                    <div className={b('label')}>{value.label}</div>
                    <div className={b('value')}>{value.value}</div>
                </div>
            ))}
        </div>
    );
};
