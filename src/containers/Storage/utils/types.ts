import {TVSlotId} from '../../../types/api/vdisk';

export interface UnavailableDonor extends TVSlotId {
    DonorMode?: boolean;
    StoragePoolName?: string;
}
