import type {TopicStats} from '../../../types/api/topic';
import {formatBytes} from '../../../utils';
import {
    parseLag,
    parseTimestampToIdleTime,
    formatDurationToShortTimeFormat,
} from '../../../utils/timeParsers';
import {convertBytesObjectToSpeed} from '../../../utils/bytesParsers';

import {SpeedMultiMeter} from '../../SpeedMultiMeter';

import {createInfoFormatter} from '../utils';

export const formatTopicStats = createInfoFormatter<TopicStats>({
    values: {
        store_size_bytes: formatBytes,
        min_last_write_time: (value) =>
            formatDurationToShortTimeFormat(parseTimestampToIdleTime(value)),
        max_write_time_lag: (value) => formatDurationToShortTimeFormat(parseLag(value)),
        bytes_written: (value) =>
            value && <SpeedMultiMeter data={convertBytesObjectToSpeed(value)} withValue={false} />,
    },
    labels: {
        store_size_bytes: 'Store size',
        min_last_write_time: 'Partitions max time since last write',
        max_write_time_lag: 'Partitions max write time lag',
        bytes_written: 'Average write speed',
    },
});
