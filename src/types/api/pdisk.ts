import {EFlag} from './enums';

// endpoint: /viewer/json/pdiskinfo
// source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/node_whiteboard.proto

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

    // these can't be sent to UI
    Missing = 'Missing',
    Timeout = 'Timeout',
    NodeDisconnected = 'NodeDisconnected',
    Unknown = 'Unknown',
}
