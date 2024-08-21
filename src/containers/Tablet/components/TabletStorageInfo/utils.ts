import type {TTabletHiveResponse} from '../../../../types/api/tablet';

import type {TabletStorageItem} from './types';

export function prepareData(data?: TTabletHiveResponse | null): TabletStorageItem[] {
    if (!data) {
        return [];
    }
    const {BoundChannels, TabletStorageInfo = {}} = data;

    const Channels = TabletStorageInfo.Channels ?? [];

    const result = [];

    for (const channel of Channels) {
        const channelIndex = channel.Channel;
        const channelHistory = channel.History;
        if (!channelIndex || !channelHistory || !channelHistory.length) {
            continue;
        }
        const copiedChannelHistory = [...channelHistory];

        copiedChannelHistory.reverse();
        const [latest, ...rest] = copiedChannelHistory;
        const storagePoolName = BoundChannels?.[channelIndex]?.StoragePoolName;

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
