import type {TBSGroupStateInfo} from '../api/storage';

export interface IStoragePoolGroup extends TBSGroupStateInfo {
    Read: number;
    Write: number;
    PoolName?: string;
    Used: number;
    Limit: number;
    Missing: number;
    UsedSpaceFlag: number;
    Type: string | null;
}
