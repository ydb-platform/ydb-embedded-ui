import type {IResponseError} from '../../../types/api/error';
import type {TPDiskStateInfo} from '../../../types/api/pdisk';
import type {TStorageInfo} from '../../../types/api/storage';
import type {TEvSystemStateResponse} from '../../../types/api/systemState';
import type {TVDiskStateInfo} from '../../../types/api/vdisk';
import type {ApiRequestAction} from '../../utils';

import {FETCH_NODE, FETCH_NODE_STRUCTURE, resetNode} from './node';

interface RawStructurePDisk extends TPDiskStateInfo {
    vDisks: Record<string, TVDiskStateInfo>;
}

export type RawNodeStructure = Record<string, RawStructurePDisk>;

export interface PreparedStructureVDisk extends TVDiskStateInfo {
    id: string;
    order: number;
}

export interface PreparedStructurePDisk extends TPDiskStateInfo {
    vDisks: PreparedStructureVDisk[];
}

export type PreparedNodeStructure = Record<string, PreparedStructurePDisk>;

export interface NodeState {
    data: TEvSystemStateResponse;
    loading: boolean;
    wasLoaded: boolean;

    nodeStructure: TStorageInfo;
    loadingStructure: boolean;
    wasLoadedStructure: boolean;
}

export type NodeAction =
    | ApiRequestAction<typeof FETCH_NODE, TEvSystemStateResponse, IResponseError>
    | ApiRequestAction<typeof FETCH_NODE_STRUCTURE, TStorageInfo, IResponseError>
    | ReturnType<typeof resetNode>;

export interface NodeStateSlice {
    node: NodeState;
}
