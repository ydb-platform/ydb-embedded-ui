import type {MultipleWindowsStat} from '../../../types/api/consumer';
import type {TopicStats} from '../../../types/api/topic';
import {formatBytes} from '../../../utils';
import {DAY_IN_SECONDS, HOUR_IN_SECONDS, MINUTE_IN_SECONDS} from '../../../utils/constants';

import {
    parseProtobufTimestampToMs,
    parseProtobufDurationToMs,
    formatDurationToShortTimeFormat,
} from '../../../utils/timeParsers';

import {VerticalBars} from '../../VerticalBars/VerticalBars';

import {createInfoFormatter} from '../utils';

export const prepareBytesWritten = (data?: MultipleWindowsStat) => {
    return {
        per_minute:
            data && data.per_minute ? Math.floor(Number(data.per_minute) / MINUTE_IN_SECONDS) : 0,
        per_hour: data && data.per_hour ? Math.floor(Number(data.per_hour) / HOUR_IN_SECONDS) : 0,
        per_day: data && data.per_day ? Math.floor(Number(data.per_day) / DAY_IN_SECONDS) : 0,
    };
};

export const formatTopicStats = createInfoFormatter<TopicStats>({
    values: {
        store_size_bytes: formatBytes,
        min_last_write_time: (value) => {
            if (!value) {
                return formatDurationToShortTimeFormat(0);
            }

            const durationMs = Date.now() - parseProtobufTimestampToMs(value);

            // Duration could be negative because of the difference between server and local time
            // Usually it below 100ms, so it could be omitted
            return formatDurationToShortTimeFormat(durationMs < 0 ? 0 : durationMs);
        },
        max_write_time_lag: (value) =>
            formatDurationToShortTimeFormat(value ? parseProtobufDurationToMs(value) : 0),
        bytes_written: (value) =>
            value && <VerticalBars values={Object.values(prepareBytesWritten(value))} />,
    },
    labels: {
        store_size_bytes: 'Store size',
        min_last_write_time: 'Partitions max time since last write',
        max_write_time_lag: 'Partitions max write time lag',
        bytes_written: 'Average write speed',
    },
});
