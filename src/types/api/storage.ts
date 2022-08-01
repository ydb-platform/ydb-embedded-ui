enum EFlag {
    Grey = 'Grey',
    Green = 'Green',
    Yellow = 'Yellow',
    Orange = 'Orange',
    Red = 'Red',
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

    Missing = 'Missing',
    Timeout = 'Timeout',
    NodeDisconnected = 'NodeDisconnected',
    Unknown = 'Unknown',
}

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
