import type {EFlag} from './enums';
import type {TVDiskStateInfo, TVSlotEntry} from './vdisk';

/**
 * endpoint: /viewer/json/pdiskinfo
 */
export interface TEvPDiskStateResponse {
    PDiskStateInfo?: TPDiskStateInfo[];
    /** uint64 */
    ResponseTime?: string;
    ResponseDuration?: number;
}

/**
 * Node whiteboard PDisk data
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/node_whiteboard.proto
 */
export interface TPDiskStateInfo {
    PDiskId?: number;
    /** uint64 */
    CreateTime?: string;
    /** uint64 */
    ChangeTime?: string;
    Path?: string;
    /** uint64 */
    Guid?: string;
    /** uint64 */
    Category?: string;
    /** uint64 */
    AvailableSize?: string;
    /** uint64 */
    TotalSize?: string;
    State?: TPDiskState;
    NodeId?: number;
    Count?: number;
    Device?: EFlag;
    Realtime?: EFlag;
    StateFlag?: EFlag;
    Overall?: EFlag;
    SerialNumber?: string;
    /** uint64 */
    SystemSize?: string;
    /** uint64 */
    LogUsedSize?: string;
    /** uint64 */
    LogTotalSize?: string;
    /** uint64 */
    EnforcedDynamicSlotSize?: string;
    ExpectedSlotCount?: number;
}

export enum TPDiskState {
    Initial = 'Initial',
    InitialFormatRead = 'InitialFormatRead',
    InitialFormatReadError = 'InitialFormatReadError',
    InitialSysLogRead = 'InitialSysLogRead',
    InitialSysLogReadError = 'InitialSysLogReadError',
    InitialSysLogParseError = 'InitialSysLogParseError',
    InitialCommonLogRead = 'InitialCommonLogRead',
    InitialCommonLogReadError = 'InitialCommonLogReadError',
    InitialCommonLogParseError = 'InitialCommonLogParseError',
    CommonLoggerInitError = 'CommonLoggerInitError',
    Normal = 'Normal',
    OpenFileError = 'OpenFileError',
    ChunkQuotaError = 'ChunkQuotaError',
    DeviceIoError = 'DeviceIoError',
    Stopped = 'Stopped',

    // these can't be sent to UI
    Missing = 'Missing',
    Timeout = 'Timeout',
    NodeDisconnected = 'NodeDisconnected',
    Unknown = 'Unknown',
}

/**
 * endpoint: /pdisk/info
 */
export interface TPDiskInfoResponse {
    Whiteboard?: TPDiskInfoWhiteboard;
    BSC?: TPDiskInfoBSC;
}

interface TPDiskInfoWhiteboard {
    PDisk?: TPDiskStateInfo;
    VDisks?: TVDiskStateInfo[];
}

interface TPDiskInfoBSC {
    PDisk?: TPDiskInfo;
    VDisks?: TVSlotEntry[];
}

/**
 * BSC PDisk data
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/sys_view.proto
 */
export interface TPDiskInfo {
    Type?: EPDiskType;
    /** uint64 */
    Kind?: string;
    Path?: string;
    /** uint64 */
    Guid?: string;
    /** uint64 */
    BoxId?: string;
    SharedWithOs?: boolean;
    ReadCentric?: boolean;
    /** uint64 */
    AvailableSize?: string;
    /** uint64 */
    TotalSize?: string;
    StatusV2?: EDriveStatus;
    /** uint64 */
    StatusChangeTimestamp?: string;
    /** uint64 */
    EnforcedDynamicSlotSize?: string;
    ExpectedSlotCount?: number;
    NumActiveSlots?: number;
    /** uint64 */
    Category?: string;
    DecommitStatus?: EDecommitStatus;
}

export type EDriveStatus =
    | 'UNKNOWN' // value of status is unknown (default)
    | 'ACTIVE' // working as expected
    | 'INACTIVE' // new groups are not created over this drive, but existing ones continue to work as expected
    | 'BROKEN' // drive is not working, groups are automatically moved out of this drive upon reception of this status
    | 'FAULTY' // drive is expected to become BROKEN soon, new groups are not created, old groups are asynchronously moved out from this drive
    | 'TO_BE_REMOVED'; // same as INACTIVE, but drive is counted in fault model as not working

export type EDecommitStatus =
    | 'DECOMMIT_UNSET'
    | 'DECOMMIT_NONE' // no decommission
    | 'DECOMMIT_PENDING' // drive is going to be removed soon, but SelfHeal logic would not remove it automatically
    | 'DECOMMIT_IMMINENT' // drive is going to be settled automatically
    | 'DECOMMIT_REJECTED'; // drive is working as usual, but decommitted slots are not placed here

type EPDiskType =
    | 'ROT' // rotational drives (HDD)
    | 'SSD' // solid state drives (SSD)
    | 'NVME' // PCIe-connected solid state drives (NVMe SSD)
    | 'UNKNOWN_TYPE'; // used if device type is unknown or if group consists of different PDisk device types
