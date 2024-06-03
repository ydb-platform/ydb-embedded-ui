import type {YQLEntity} from '@gravity-ui/websql-autocomplete';

export const LANGUAGE_YQL_ID = 'yql';

export const SimpleTypes = [
    'String',
    'Bool',
    'Int32',
    'Uint32',
    'Int64',
    'Uint64',
    'Float',
    'Double',
    'Void',
    'Yson',
    'Utf8',
    'Unit',
    'Json',
    'Date',
    'Datetime',
    'Timestamp',
    'Interval',
    'Null',
    'Int8',
    'Uint8',
    'Int16',
    'Uint16',
    'TzDate',
    'TzDatetime',
    'TzTimestamp',
    'Uuid',
    'EmptyList',
    'EmptyDict',
    'JsonDocument',
    'DyNumber',
];

export const SimpleFunctions = [
    'CAST',
    'COALESCE',
    'LENGTH',
    'LEN',
    'SUBSTRING',
    'FIND',
    'RFIND',
    'StartsWith',
    'EndsWith',
    'IF',
    'NANVL',
    'Random',
    'RandomNumber',
    'RandomUuid',
    'CurrentUtcDate',
    'CurrentUtcDatetime',
    'CurrentUtcTimestamp',
    'CurrentTzDate',
    'CurrentTzDatetime',
    'CurrentTzTimestamp',
    'AddTimezone',
    'RemoveTimezone',
    'MAX_OF',
    'MIN_OF',
    'GREATEST',
    'LEAST',
    'AsTuple',
    'AsStruct',
    'AsList',
    'AsDict',
    'AsSet',
    'AsListStrict',
    'AsDictStrict',
    'AsSetStrict',
    'Variant',
    'AsVariant',
    'Enum',
    'AsEnum',
    'AsTagged',
    'Untag',
    'TableRow',
    'JoinTableRow',
    'Ensure',
    'EnsureType',
    'EnsureConvertibleTo',
    'ToBytes',
    'FromBytes',
    'ByteAt',
    'TestBit',
    'ClearBit',
    'SetBit',
    'FlipBit',
    'Abs',
    'Just',
    'Unwrap',
    'Nothing',
    'Callable',
    'StaticMap',
    'StaticZip',
    'ListCreate',
    'AsListStrict',
    'ListLength',
    'ListHasItems',
    'ListCollect',
    'ListSort',
    'ListSortAsc',
    'ListSortDesc',
    'ListExtend',
    'ListExtendStrict',
    'ListUnionAll',
    'ListZip',
    'ListZipAll',
    'ListEnumerate',
    'ListReverse',
    'ListSkip',
    'ListTake',
    'ListIndexOf',
    'ListMap',
    'ListFilter',
    'ListFlatMap',
    'ListNotNull',
    'ListFlatten',
    'ListUniq',
    'ListAny',
    'ListAll',
    'ListHas',
    'ListHead',
    'ListLast',
    'ListMin',
    'ListMax',
    'ListSum',
    'ListAvg',
    'ListFold',
    'ListFold1',
    'ListFoldMap',
    'ListFold1Map',
    'ListFromRange',
    'ListReplicate',
    'ListConcat',
    'ListExtract',
    'ListTakeWhile',
    'ListSkipWhile',
    'ListAggregate',
    'ToDict',
    'ToMultiDict',
    'ToSet',
    'DictCreate',
    'SetCreate',
    'DictLength',
    'DictHasItems',
    'DictItems',
    'DictKeys',
    'DictPayloads',
    'DictLookup',
    'DictContains',
    'DictAggregate',
    'SetIsDisjoint',
    'SetIntersection',
    'SetIncludes',
    'SetUnion',
    'SetDifference',
    'SetSymmetricDifference',
    'TryMember',
    'ExpandStruct',
    'AddMember',
    'RemoveMember',
    'ForceRemoveMember',
    'ChooseMembers',
    'RemoveMembers',
    'ForceRemoveMembers',
    'CombineMembers',
    'FlattenMembers',
    'StructMembers',
    'RenameMembers',
    'ForceRenameMembers',
    'GatherMembers',
    'SpreadMembers',
    'ForceSpreadMembers',
    'FormatType',
    'ParseType',
    'TypeOf',
    'InstanceOf',
    'DataType',
    'OptionalType',
    'ListType',
    'StreamType',
    'DictType',
    'TupleType',
    'StructType',
    'VariantType',
    'ResourceType',
    'CallableType',
    'GenericType',
    'UnitType',
    'VoidType',
    'OptionalItemType',
    'ListItemType',
    'StreamItemType',
    'DictKeyType',
    'DictPayloadType',
    'TupleElementType',
    'StructMemberType',
    'CallableResultType',
    'CallableArgumentType',
    'VariantUnderlyingType',
    'JSON_EXISTS',
    'JSON_VALUE',
    'JSON_QUERY',
];

export const AggregateFunctions = [
    'COUNT',
    'MIN',
    'MAX',
    'SUM',
    'AVG',
    'COUNT_IF',
    'SUM_IF',
    'AVG_IF',
    'SOME',
    'CountDistinctEstimate',
    'HyperLogLog',
    'AGGREGATE_LIST',
    'AGGREGATE_LIST_DISTINCT',
    'AGG_LIST',
    'AGG_LIST_DISTINCT',
    'MAX_BY',
    'MIN_BY',
    'AGGREGATE_BY',
    'MULTI_AGGREGATE_BY',
    'TOP',
    'BOTTOM',
    'TOP_BY',
    'BOTTOM_BY',
    'TOPFREQ',
    'MODE',
    'STDDEV',
    'VARIANCE',
    'CORRELATION',
    'COVARIANCE',
    'PERCENTILE',
    'MEDIAN',
    'HISTOGRAM',
    'LogarithmicHistogram',
    'LogHistogram',
    'LinearHistogram',
    'BOOL_AND',
    'BOOL_OR',
    'BOOL_XOR',
    'BIT_AND',
    'BIT_OR',
    'BIT_XOR',
    'SessionStart',
];

const RawUdfs = {
    DateTime: [
        'EndOfMonth',
        'Format',
        'FromMicroseconds',
        'FromMilliseconds',
        'FromSeconds',
        'GetDayOfMonth',
        'GetDayOfWeek',
        'GetDayOfWeekName',
        'GetDayOfYear',
        'GetHour',
        'GetMicrosecondOfSecond',
        'GetMillisecondOfSecond',
        'GetMinute',
        'GetMonth',
        'GetMonthName',
        'GetSecond',
        'GetTimezoneId',
        'GetTimezoneName',
        'GetWeekOfYear',
        'GetWeekOfYearIso8601',
        'GetYear',
        'IntervalFromDays',
        'IntervalFromHours',
        'IntervalFromMicroseconds',
        'IntervalFromMilliseconds',
        'IntervalFromMinutes',
        'IntervalFromSeconds',
        'MakeDate',
        'MakeDatetime',
        'MakeTimestamp',
        'MakeTzDate',
        'MakeTzDatetime',
        'MakeTzTimestamp',
        'Parse',
        'ParseHttp',
        'ParseIso8601',
        'ParseRfc822',
        'ParseX509',
        'ShiftMonths',
        'ShiftQuarters',
        'ShiftYears',
        'Split',
        'StartOf',
        'StartOfDay',
        'StartOfMonth',
        'StartOfQuarter',
        'StartOfWeek',
        'StartOfYear',
        'TimeOfDay',
        'ToDays',
        'ToHours',
        'ToMicroseconds',
        'ToMilliseconds',
        'ToMinutes',
        'ToSeconds',
        'Update',
    ],

    Dsv: ['Parse', 'ReadRecord', 'Serialize'],

    String: [
        'AsciiToLower',
        'AsciiToTitle',
        'AsciiToUpper',
        'Base32Decode',
        'Base32Encode',
        'Base32StrictDecode',
        'Base64Decode',
        'Base64Encode',
        'Base64EncodeUrl',
        'Base64StrictDecode',
        'Bin',
        'BinText',
        'CgiEscape',
        'CgiUnescape',
        'Collapse',
        'CollapseText',
        'Contains',
        'DecodeHtml',
        'EncodeHtml',
        'EndsWith',
        'EndsWithIgnoreCase',
        'EscapeC',
        'FromByteList',
        'HasPrefix',
        'HasPrefixIgnoreCase',
        'HasSuffix',
        'HasSuffixIgnoreCase',
        'Hex',
        'HexDecode',
        'HexEncode',
        'HexText',
        'HumanReadableBytes',
        'HumanReadableDuration',
        'HumanReadableQuantity',
        'IsAscii',
        'IsAsciiAlnum',
        'IsAsciiAlpha',
        'IsAsciiDigit',
        'IsAsciiHex',
        'IsAsciiLower',
        'IsAsciiSpace',
        'IsAsciiUpper',
        'JoinFromList',
        'LeftPad',
        'LevensteinDistance',
        'Prec',
        'RemoveAll',
        'RemoveFirst',
        'RemoveLast',
        'ReplaceAll',
        'ReplaceFirst',
        'ReplaceLast',
        'RightPad',
        'SBin',
        'SHex',
        'SplitToList',
        'StartsWith',
        'StartsWithIgnoreCase',
        'Strip',
        'ToByteList',
        'UnescapeC',
    ],

    Unicode: [
        'Find',
        'Fold',
        'FromCodePointList',
        'GetLength',
        'IsAlnum',
        'IsAlpha',
        'IsAscii',
        'IsDigit',
        'IsHex',
        'IsLower',
        'IsSpace',
        'IsUnicodeSet',
        'IsUpper',
        'IsUtf',
        'JoinFromList',
        'LevensteinDistance',
        'Normalize',
        'NormalizeNFC',
        'NormalizeNFD',
        'NormalizeNFKC',
        'NormalizeNFKD',
        'RFind',
        'RemoveAll',
        'RemoveFirst',
        'RemoveLast',
        'ReplaceAll',
        'ReplaceFirst',
        'ReplaceLast',
        'Reverse',
        'SplitToList',
        'Strip',
        'Substring',
        'ToCodePointList',
        'ToLower',
        'ToTitle',
        'ToUint64',
        'ToUpper',
        'Translit',
        'TryToUint64',
    ],

    Url: [
        'BuildQueryString',
        'CanBePunycodeHostName',
        'CutQueryStringAndFragment',
        'CutScheme',
        'CutWWW',
        'CutWWW2',
        'Decode',
        'Encode',
        'ForceHostNameToPunycode',
        'ForcePunycodeToHostName',
        'GetCGIParam',
        'GetDomain',
        'GetDomainLevel',
        'GetFragment',
        'GetHost',
        'GetHostPort',
        'GetOwner',
        'GetPath',
        'GetPort',
        'GetScheme',
        'GetSchemeHost',
        'GetSchemeHostPort',
        'GetSignificantDomain',
        'GetTLD',
        'GetTail',
        'HostNameToPunycode',
        'IsAllowedByRobotsTxt',
        'IsKnownTLD',
        'IsWellKnownTLD',
        'Normalize',
        'NormalizeWithDefaultHttpScheme',
        'Parse',
        'PunycodeToHostName',
        'QueryStringToDict',
        'QueryStringToList',
    ],

    Yson: [
        'Attributes',
        'Contains',
        'ConvertTo',
        'ConvertToBool',
        'ConvertToBoolDict',
        'ConvertToBoolList',
        'ConvertToDict',
        'ConvertToDouble',
        'ConvertToDoubleDict',
        'ConvertToDoubleList',
        'ConvertToInt64',
        'ConvertToInt64Dict',
        'ConvertToInt64List',
        'ConvertToList',
        'ConvertToString',
        'ConvertToStringDict',
        'ConvertToStringList',
        'ConvertToUint64',
        'ConvertToUint64Dict',
        'ConvertToUint64List',
        'Equals',
        'From',
        'GetHash',
        'GetLength',
        'IsBool',
        'IsDict',
        'IsDouble',
        'IsEntity',
        'IsInt64',
        'IsList',
        'IsString',
        'IsUint64',
        'Lookup',
        'LookupBool',
        'LookupDict',
        'LookupDouble',
        'LookupInt64',
        'LookupList',
        'LookupString',
        'LookupUint64',
        'Options',
        'Parse',
        'ParseJson',
        'ParseJsonDecodeUtf8',
        'Serialize',
        'SerializeJson',
        'SerializePretty',
        'SerializeText',
        'WithAttributes',
        'YPath',
        'YPathBool',
        'YPathDict',
        'YPathDouble',
        'YPathInt64',
        'YPathList',
        'YPathString',
        'YPathUint64',
    ],

    HyperLogLog: ['AddValue', 'Create', 'Deserialize', 'GetResult', 'Merge', 'Serialize'],
    Hyperscan: [
        'BacktrackingGrep',
        'BacktrackingMatch',
        'Capture',
        'Grep',
        'Match',
        'MultiGrep',
        'MultiMatch',
        'Replace',
    ],
    Ip: [
        'ConvertToIPv6',
        'FromString',
        'GetSubnet',
        'GetSubnetByMask',
        'IsEmbeddedIPv4',
        'IsIPv4',
        'IsIPv6',
        'SubnetFromString',
        'SubnetMatch',
        'SubnetToString',
        'ToFixedIPv6String',
        'ToString',
    ],
    Json: [
        'BoolAsJsonNode',
        'CompilePath',
        'DoubleAsJsonNode',
        'JsonAsJsonNode',
        'JsonDocumentSqlExists',
        'JsonDocumentSqlQuery',
        'JsonDocumentSqlQueryConditionalWrap',
        'JsonDocumentSqlQueryWrap',
        'JsonDocumentSqlTryExists',
        'JsonDocumentSqlValueBool',
        'JsonDocumentSqlValueConvertToUtf8',
        'JsonDocumentSqlValueInt64',
        'JsonDocumentSqlValueNumber',
        'JsonDocumentSqlValueUtf8',
        'Parse',
        'Serialize',
        'SerializeToJsonDocument',
        'SqlExists',
        'SqlQuery',
        'SqlQueryConditionalWrap',
        'SqlQueryWrap',
        'SqlTryExists',
        'SqlValueBool',
        'SqlValueConvertToUtf8',
        'SqlValueInt64',
        'SqlValueNumber',
        'SqlValueUtf8',
        'Utf8AsJsonNode',
    ],
    Math: [
        'Abs',
        'Acos',
        'Asin',
        'Asinh',
        'Atan',
        'Atan2',
        'Cbrt',
        'Ceil',
        'Cos',
        'Cosh',
        'E',
        'Eps',
        'Erf',
        'ErfInv',
        'ErfcInv',
        'Exp',
        'Exp2',
        'Fabs',
        'Floor',
        'Fmod',
        'FuzzyEquals',
        'Hypot',
        'IsFinite',
        'IsInf',
        'IsNaN',
        'Ldexp',
        'Lgamma',
        'Log',
        'Log10',
        'Log2',
        'Mod',
        'NearbyInt',
        'Pi',
        'Pow',
        'Rem',
        'Remainder',
        'Rint',
        'Round',
        'RoundDownward',
        'RoundToNearest',
        'RoundTowardZero',
        'RoundUpward',
        'Sigmoid',
        'Sin',
        'Sinh',
        'Sqrt',
        'Tan',
        'Tanh',
        'Tgamma',
        'Trunc',
    ],

    Pire: ['Capture', 'Grep', 'Match', 'MultiGrep', 'MultiMatch', 'Replace'],

    Re2: [
        'Capture',
        'Count',
        'Escape',
        'FindAndConsume',
        'Grep',
        'Match',
        'Options',
        'PatternFromLike',
        'Replace',
    ],

    Re2posix: [
        'Capture',
        'Count',
        'Escape',
        'FindAndConsume',
        'Grep',
        'Match',
        'Options',
        'PatternFromLike',
        'Replace',
    ],

    Digest: [
        'Argon2',
        'Blake2B',
        'CityHash',
        'CityHash128',
        'Crc32c',
        'Crc64',
        'FarmHashFingerprint',
        'FarmHashFingerprint128',
        'FarmHashFingerprint2',
        'FarmHashFingerprint32',
        'FarmHashFingerprint64',
        'Fnv32',
        'Fnv64',
        'HighwayHash',
        'IntHash64',
        'Md5HalfMix',
        'Md5Hex',
        'Md5Raw',
        'MurMurHash',
        'MurMurHash2A',
        'MurMurHash2A32',
        'MurMurHash32',
        'NumericHash',
        'Sha1',
        'Sha256',
        'SipHash',
        'SuperFastHash',
        'XXH3',
        'XXH3_128',
    ],

    Histogram: [
        'CalcLowerBound',
        'CalcLowerBoundSafe',
        'CalcUpperBound',
        'CalcUpperBoundSafe',
        'GetSumAboveBound',
        'GetSumBelowBound',
        'GetSumInRange',
        'Normalize',
        'Print',
        'ToCumulativeDistributionFunction',
    ],
};

export const Udfs = Object.entries(RawUdfs).reduce((acc, [udfModule, functions]) => {
    const moduleFunctions = functions.map((f) => `${udfModule}::${f}`);
    return acc.concat(moduleFunctions);
}, [] as string[]);

export const WindowFunctions = [
    'ROW_NUMBER',
    'LAG',
    'LEAD',
    'FIRST_VALUE',
    'LAST_VALUE',
    'RANK',
    'DENSE_RANK',
    'SessionState',
];

export const TableFunction = [];

export const Pragmas = ['TablePathPrefix', 'Warning'];

export const EntitySettings: Record<YQLEntity, string[]> = {
    table: [
        'AUTO_PARTITIONING_BY_SIZE',
        'AUTO_PARTITIONING_PARTITION_SIZE_MB',
        'AUTO_PARTITIONING_BY_LOAD',
        'AUTO_PARTITIONING_MIN_PARTITIONS_COUNT',
        'AUTO_PARTITIONING_MAX_PARTITIONS_COUNT',
        'UNIFORM_PARTITIONS',
        'READ_REPLICAS_SETTINGS',
        'TTL',
        'KEY_BLOOM_FILTER',
        'STORE',
    ],
    view: ['security_invoker'],
    topic: [
        'min_active_partitions',
        'partition_count_limit',
        'retention_period',
        'retention_storage_mb',
        'partition_write_speed_bytes_per_second',
        'partition_write_burst_bytes',
        'metering_mode',
    ],
    object: [],
    user: [],
    group: [],
    externalDataSource: [],
    externalTable: [],
    tableStore: [],
    replication: [],
    tableIndex: [],
};
