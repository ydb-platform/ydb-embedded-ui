import type {SelectOption} from '@gravity-ui/uikit';

import i18n from './i18n';

export const TimeFrameIds = {
    hour: 'hour',
    minute: 'minute',
} as const;

export type TimeFrameId = keyof typeof TimeFrameIds;

export const TIME_FRAME_OPTIONS: SelectOption[] = [
    {
        value: TimeFrameIds.hour,
        content: i18n('timeframe_hour'),
    },
    {
        value: TimeFrameIds.minute,
        content: i18n('timeframe_minute'),
    },
];

export const DEFAULT_TIME_FILTER_VALUE = {
    start: {
        value: 'now-6h',
        type: 'relative',
    },
    end: {
        value: 'now',
        type: 'relative',
    },
} as const;
