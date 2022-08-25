import type {TVDiskStateInfo, TVSlotId} from '../../../types/api/storage';

export * from './constants';

export const isFullDonorData = (donor: TVDiskStateInfo | TVSlotId): donor is TVDiskStateInfo =>
    'VDiskId' in donor;
