export type RequiredField<Src, Fields extends keyof Src> = Src & Required<Pick<Src, Fields>>;

export enum YQLType {
    // Numeric
    Bool = 'Bool',
    Int8 = 'Int8',
    Int16 = 'Int16',
    Int32 = 'Int32',
    Int64 = 'Int64',
    Uint8 = 'Uint8',
    Uint16 = 'Uint16',
    Uint32 = 'Uint32',
    Uint64 = 'Uint64',
    Float = 'Float',
    Double = 'Double',
    Decimal = 'Decimal',

    // String
    String = 'String',
    Utf8 = 'Utf8',
    Json = 'Json',
    JsonDocument = 'JsonDocument',
    Yson = 'Yson',
    Uuid = 'Uuid',

    // Date and time
    Date = 'Date',
    Datetime = 'Datetime',
    Timestamp = 'Timestamp',
    Interval = 'Interval',
    TzDate = 'TzDate',
    TzDateTime = 'TzDateTime',
    TzTimestamp = 'TzTimestamp',
}
