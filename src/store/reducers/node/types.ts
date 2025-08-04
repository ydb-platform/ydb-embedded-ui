import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import type {PreparedNodeSystemState} from '../../../utils/nodes';

interface RawStructurePDisk extends PreparedPDisk {
    vDisks: Record<string, PreparedVDisk>;
}

export type RawNodeStructure = Record<string, RawStructurePDisk>;

export interface PreparedStructureVDisk extends PreparedVDisk {
    id: string;
    order: number;
}

export interface PreparedStructurePDisk extends PreparedPDisk {
    vDisks: PreparedStructureVDisk[];
}

export type PreparedNodeStructure = Record<string, PreparedStructurePDisk>;

export interface PreparedNode extends Partial<PreparedNodeSystemState> {}
