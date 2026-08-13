import {EType} from '../../types/api/tablet';

export type TabletObjectKind = 'table' | 'topic';

export function hasHive(id?: string): id is string {
    return Boolean(id && id !== '0');
}

export function getTabletObjectKind(type?: EType): TabletObjectKind | undefined {
    switch (type) {
        case EType.DataShard:
            return 'table';
        case EType.PersQueue:
        case EType.PersQueueReadBalancer:
            return 'topic';
        default:
            return undefined;
    }
}
