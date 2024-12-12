import type {ETabletState} from '../api/tablet';

export interface ITabletPreparedHistoryItem {
    nodeId: string;
    generation: number | undefined;
    changeTime: string | undefined;
    state: ETabletState | undefined;
    leader: boolean | undefined;
    followerId: number | undefined;
    fqdn: string | undefined;
}
