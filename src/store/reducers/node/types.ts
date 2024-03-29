import type {IResponseError} from '../../../types/api/error';
import type {TStorageInfo} from '../../../types/api/storage';
import type {TVDiskStateInfo} from '../../../types/api/vdisk';
import type {PreparedPDisk} from '../../../utils/disks/types';
import type {PreparedNodeSystemState} from '../../../utils/nodes';
import type {ApiRequestAction} from '../../utils';

import {FETCH_NODE, FETCH_NODE_STRUCTURE, resetNode} from './node';

interface RawStructurePDisk extends PreparedPDisk {
    vDisks: Record<string, TVDiskStateInfo>;
}

export type RawNodeStructure = Record<string, RawStructurePDisk>;

export interface PreparedStructureVDisk extends TVDiskStateInfo {
    id: string;
    order: number;
}

export interface PreparedStructurePDisk extends PreparedPDisk {
    vDisks: PreparedStructureVDisk[];
}

export type PreparedNodeStructure = Record<string, PreparedStructurePDisk>;

export interface PreparedNode extends Partial<PreparedNodeSystemState> {}

export interface NodeState {
    data: PreparedNode;
    loading: boolean;
    wasLoaded: boolean;
    error?: IResponseError;

    nodeStructure: TStorageInfo;
    loadingStructure: boolean;
    wasLoadedStructure: boolean;
    errorStructure?: IResponseError;
}

export type NodeAction =
    | ApiRequestAction<typeof FETCH_NODE, PreparedNode, IResponseError>
    | ApiRequestAction<typeof FETCH_NODE_STRUCTURE, TStorageInfo, IResponseError>
    | ReturnType<typeof resetNode>;

export interface NodeStateSlice {
    node: NodeState;
}
