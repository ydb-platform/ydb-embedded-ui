import type {IResponseError} from '../../../types/api/error';
import type {PreparedPDisk} from '../../../utils/disks/types';
import type {ApiRequestAction} from '../../utils';
import type {PreparedStorageGroup} from '../storage/types';
import type {FETCH_PDISK, FETCH_PDISK_GROUPS, setPDiskDataWasNotLoaded} from './pdisk';

interface PDiskData extends PreparedPDisk {
    NodeId?: number;
    NodeHost?: string;
    NodeType?: string;
    NodeDC?: string;
}

export interface PDiskState {
    pDiskLoading: boolean;
    pDiskWasLoaded: boolean;
    pDiskData: PDiskData;
    pDiskError?: IResponseError;

    groupsLoading: boolean;
    groupsWasLoaded: boolean;
    groupsData: PreparedStorageGroup[];
    groupsError?: IResponseError;
}

export type PDiskAction =
    | ApiRequestAction<typeof FETCH_PDISK, PDiskData, IResponseError>
    | ApiRequestAction<typeof FETCH_PDISK_GROUPS, PreparedStorageGroup[], IResponseError>
    | ReturnType<typeof setPDiskDataWasNotLoaded>;
