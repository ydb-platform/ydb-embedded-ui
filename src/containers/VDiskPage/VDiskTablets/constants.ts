import {vDiskPageKeyset} from '../i18n';

export const COLUMNS_NAMES = {
    TABLET_ID: 'TabletId',
    CHANNEL_ID: 'ChannelId',
    COUNT: 'Count',
    SIZE: 'Size',
} as const;

export const COLUMNS_TITLES = {
    [COLUMNS_NAMES.TABLET_ID]: vDiskPageKeyset('tablet-id'),
    [COLUMNS_NAMES.CHANNEL_ID]: vDiskPageKeyset('channel-id'),
    [COLUMNS_NAMES.COUNT]: vDiskPageKeyset('count'),
    [COLUMNS_NAMES.SIZE]: vDiskPageKeyset('size'),
} as const;
