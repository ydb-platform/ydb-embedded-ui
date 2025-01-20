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
    Date32 = 'Date32',
    Datetime64 = 'Datetime64',
    Timestamp64 = 'Timestamp64',
    Interval64 = 'Interval64',
    TzDate32 = 'TzDate32',
    TzDatetime64 = 'TzDatetime64',
    TzTimestamp64 = 'TzTimestamp64',
}
