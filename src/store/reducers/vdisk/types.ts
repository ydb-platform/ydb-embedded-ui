import type {IResponseError} from '../../../types/api/error';
import type {PreparedVDisk} from '../../../utils/disks/types';
import type {ApiRequestAction} from '../../utils';
import type {PreparedStorageGroup} from '../storage/types';
import type {FETCH_VDISK, setVDiskDataWasNotLoaded} from './vdisk';

export type VDiskGroup = Partial<PreparedStorageGroup>;

export interface VDiskData extends PreparedVDisk {
    NodeId?: number;
    NodeHost?: string;
    NodeType?: string;
    NodeDC?: string;

    PDiskId?: number;
    PDiskType?: string;
}

export interface VDiskState {
    loading: boolean;
    wasLoaded: boolean;
    error?: IResponseError;

    vDiskData: VDiskData;
    groupData?: VDiskGroup;
}

export type VDiskAction =
    | ApiRequestAction<
          typeof FETCH_VDISK,
          {vDiskData: VDiskData; groupData?: VDiskGroup},
          IResponseError
      >
    | ReturnType<typeof setVDiskDataWasNotLoaded>;
