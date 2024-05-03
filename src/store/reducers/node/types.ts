import type {TVDiskStateInfo} from '../../../types/api/vdisk';
import type {PreparedPDisk} from '../../../utils/disks/types';
import type {PreparedNodeSystemState} from '../../../utils/nodes';

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
