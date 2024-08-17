import type {TTabletHiveResponse} from '../../../../types/api/tablet';

import type {TabletStorageItem} from './types';

export function prepareData(data?: TTabletHiveResponse | null): TabletStorageItem[] {
    if (!data) {
        return [];
    }
    const {
        BoundChannels,
        TabletStorageInfo: {Channels},
    } = data;

    const result = [];

    for (const channel of Channels) {
        const channelIndex = channel.Channel;
        const history = [...channel.History];
        if (!history.length) {
            continue;
        }

        history.reverse();
        const [latest, ...rest] = history;
        const storagePoolName = BoundChannels[channelIndex].StoragePoolName;

        const params = {
            ...latest,
            storagePoolName,
            channelIndex,
            children: rest,
        };
        result.push(params);
    }
    return result;
}
