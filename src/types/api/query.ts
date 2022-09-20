// common

type Plan = Record<string, any>;
type AST = string;
type Stats = Record<string, any>;

export interface CommonFields {
    ast?: AST;
    plan?: Plan;
    stats?: Stats;
};

interface DeprecatedCommonFields {
    stats?: Stats;
}

export interface ErrorRepsonse {
    error?: any;
    issues?: any;
};

export type ExecuteActions = 'execute-script' | 'execute' | 'execute-scan' | undefined;
export type ExplainActions = 'explain' | 'explain-ast';
export type Actions = ExecuteActions | ExplainActions;

// undefined == 'classic'
export type Schemas = 'classic' | 'modern' | 'ydb' | undefined;

// ==== EXECUTE ====

// common types

type CellValue = string | number | null | undefined;

export type KeyValueRow<T = CellValue> = {
    [key: string]: T;
}

export type ArrayRow<T = CellValue> = Array<T>;

export interface ColumnType {
    name: string;
    type: string;
}

// modern response

export type ExecuteModernResponse = {
    result: ArrayRow[];
    columns: ColumnType[];
} & CommonFields;

export type ExecuteClassicResponseDeep = {
    result: KeyValueRow[];
} & CommonFields;

// can be undefined for queries like `insert into`
export type ExecuteClassicResponsePlain = KeyValueRow[] | undefined;

export type ExecuteClassicResponse = ExecuteClassicResponseDeep | ExecuteClassicResponsePlain;

export type ExecuteYdbResponse = {
    result: KeyValueRow[];
} & CommonFields;

type ExecuteResponse<Schema extends Schemas> = 
    | CommonFields // result can be undefined for queries like `insert into`
    | (
        Schema extends 'modern'
            ? ExecuteModernResponse
            : Schema extends 'ydb'
                ? ExecuteYdbResponse
                : Schema extends 'classic' | undefined
                    ? ExecuteClassicResponse
                    : unknown
    );

// deprecated response from older versions, backward compatibility

type DeprecatedExecuteResponseValue =
    | KeyValueRow[]
    | string
    // can be here because of a bug in the previous backend version
    // should be ignored in parsing
    | Plan;

export type DeprecatedExecuteResponseDeep = {
    // can be undefined for queries like `insert into`
    result?: DeprecatedExecuteResponseValue;
} & DeprecatedCommonFields;

// can be undefined for queries like `insert into`
export type DeprecatedExecuteResponsePlain = DeprecatedExecuteResponseValue | undefined;

export type DeprecatedExecuteResponse = DeprecatedExecuteResponseDeep | DeprecatedExecuteResponsePlain;


// ==== EXPLAIN ====

// modern response

type ExplainResponse = CommonFields;

// deprecated response from older versions, backward compatibility

type DeprecatedExplainResponse<Action extends ExplainActions> = (
    Action extends 'explain-ast'
        ? {ast: AST} & DeprecatedCommonFields
        : Actions extends 'explain'
            ? ({result: Plan} & DeprecatedCommonFields) | Plan
            : unknown
);


// ==== COMBINED API RESPONSE ====

export type QueryAPIExecuteResponse<Schema extends Schemas = undefined> =
    | ExecuteResponse<Schema>
    | DeprecatedExecuteResponse
    | null;

export type QueryAPIExplainResponse<Action extends ExplainActions> =
    | ExplainResponse
    | DeprecatedExplainResponse<Action>
    | null;

export type QueryAPIResponse<Action extends Actions, Schema extends Schemas = undefined> = (
    Action extends ExecuteActions
        ? QueryAPIExecuteResponse<Schema>
        : Action extends ExplainActions
            ? QueryAPIExplainResponse<Action>
            : unknown
);

export type AnyExecuteResponse = 
    | ExecuteModernResponse
    | ExecuteClassicResponse
    | ExecuteYdbResponse
    | CommonFields
    | DeprecatedExecuteResponse
    | null;

export type DeepExecuteResponse =
    | ExecuteModernResponse
    | ExecuteClassicResponseDeep
    | ExecuteYdbResponse
    | DeprecatedExecuteResponseDeep;
