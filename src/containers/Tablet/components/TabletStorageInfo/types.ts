import type {TTabletStorageInfoChannelHistory} from '../../../../types/api/tablet';

export interface TabletStorageItem extends TTabletStorageInfoChannelHistory {
    storagePoolName?: string;
    children?: TabletStorageItem[];
}
