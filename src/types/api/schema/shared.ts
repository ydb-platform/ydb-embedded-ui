export interface TStorageSettings {
    PreferredPoolKind?: string;
    AllowOtherKinds?: boolean;
}

export interface TPathID {
    /** fixed64 */
    OwnerId?: string;
    /** uint64 */
    LocalId?: string;
}

export interface TTypeInfo {
    PgTypeId?: number;
}

export interface TColumnDescription {
    Name?: string;
    Type?: string;
    TypeId?: number;
    TypeInfo?: TTypeInfo;
    Id?: number;
    Family?: number;
    FamilyName?: string;
    /** Path to sequence for default values */
    DefaultFromSequence?: string;
    DefaultFromLiteral?: {
        type: {
            type_id: string;
        };
        value: Record<string, string | number | boolean>;
    };
    NotNull?: boolean;
}

export enum EColumnCodec {
    ColumnCodecPlain = 'ColumnCodecPlain',
    ColumnCodecLZ4 = 'ColumnCodecLZ4',
    ColumnCodecZSTD = 'ColumnCodecZSTD',
}

export enum EUnit {
    UNIT_AUTO = 'UNIT_AUTO',
    UNIT_SECONDS = 'UNIT_SECONDS',
    UNIT_MILLISECONDS = 'UNIT_MILLISECONDS',
    UNIT_MICROSECONDS = 'UNIT_MICROSECONDS',
    UNIT_NANOSECONDS = 'UNIT_NANOSECONDS',
}
