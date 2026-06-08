import type {EFlag} from '../../types/api/enums';
import type {TPDiskInfo, TPDiskStateInfo} from '../../types/api/pdisk';
import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';
import type {ValueOf} from '../../types/common';

import type {PDISK_TYPES} from './getPDiskType';

/**
 * Additional UI-specific disk colors beyond the backend EFlag enum.
 * Used for special visualization states in disk progress bars.
 */
export type ExtendedDiskColor =
    | 'SolidRed' // Critical error state with solid red background
    | 'SpaceCyan' // Space mode: good capacity
    | 'SpaceLightYellow' // Space mode: slightly elevated usage
    | 'SpaceLightOrange' // Space mode: high usage
    | 'SpacePreOrange' // Space mode: very high usage
    | 'SpaceOrange' // Space mode: critical usage
    | 'SpaceBlack'; // Space mode: full/over capacity

/**
 * Complete color type for disk visualization.
 * Extends backend EFlag enum with additional UI-specific colors.
 * All EFlag values are valid DiskColor values.
 */
export type DiskColor = EFlag | ExtendedDiskColor;

/**
 * Basic severity levels for data storage (0-5).
 * Used in PreparedVDisk.Severity and PreparedPDisk.Severity.
 * Represents combined severity calculated from VDiskState, DiskSpace, FrontQueues, and Replicated status.
 */
export type DataSeverity = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Extended severity levels for display (0-19).
 * Includes basic levels (0-5) plus expert mode levels (6-19).
 * Used for dynamic coloring in Expert Mode based on grouping strategy.
 *
 * Ranges:
 * - 0-5: Basic colors (Grey, Green, Blue, Yellow, Orange, Red)
 * - 6: SolidRed (State mode critical errors)
 * - 7-15: Space mode detailed capacity alerts
 * - 16-19: FrontQueues mode queue status
 */
export type DisplaySeverity =
    | DataSeverity // 0-5: basic colors
    | 6 // SolidRed (State mode)
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15 // Space mode (7-15)
    | 16
    | 17
    | 18
    | 19; // FrontQueues mode (16-19)

export type PreparedPDisk = Omit<
    TPDiskStateInfo,
    'AvailableSize' | 'TotalSize' | 'EnforcedDynamicSlotSize'
> &
    Omit<Partial<TPDiskInfo>, 'Type' | 'AvailableSize' | 'TotalSize'> & {
        Type?: PDiskType;
        Severity?: number;
        StringifiedId?: string;

        AvailableSize?: number;
        TotalSize?: number;
        AllocatedSize?: number;
        AllocatedPercent?: number;

        SlotSize?: string;
    };

export interface VDiskRecipientRef {
    NodeId?: number;
    StringifiedId?: string;
}

export interface PreparedVDisk
    extends Omit<TVDiskStateInfo, 'PDisk' | 'AvailableSize' | 'AllocatedSize' | 'Donors'> {
    PDisk?: PreparedPDisk;
    Severity?: number;
    StringifiedId?: string;

    AvailableSize?: number;
    AllocatedSize?: number;
    AllocatedPercent?: number;
    SizeLimit?: number;
    FreeSize?: number;

    Donors?: PreparedVDisk[];

    Recipient?: VDiskRecipientRef;
}

export type PDiskType = ValueOf<typeof PDISK_TYPES>;

export interface UnavailableDonor extends TVSlotId {
    DonorMode?: boolean;
    StoragePoolName?: string;
}
