import {SpeedMultiMeter} from '../../../../../components/SpeedMultiMeter';
import type {IPreparedTopicStats} from '../../../../../types/store/topic';
import {cn} from '../../../../../utils/cn';
import {formatDurationMs} from '../../../../../utils/dataFormatters/dataFormatters';

import './ConsumersTopicStats.scss';

const b = cn('ydb-diagnostics-consumers-topic-stats');

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
            value: formatDurationMs(partitionsWriteLag || 0),
        },
        {
            label: 'Write idle time',
            value: formatDurationMs(partitionsIdleTime || 0),
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
