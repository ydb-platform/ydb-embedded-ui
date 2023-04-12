// ==== types from backend protos ====
interface Position {
    row?: number;
    column?: number;
    file?: string;
}

interface IssueMessage {
    position?: Position;
    end_position?: Position;
    message?: string;
    issue_code?: number;
    severity?: number;
    issues?: IssueMessage[];
}

/** incomplete */
interface TDqStageStats {}

/** incomplete */
interface TKqpStatsCompile {}

interface TDqTableStats {
    TablePath?: string;
    /** uint64 */
    ReadRows?: string;
    /** uint64 */
    ReadBytes?: string;
    /** uint64 */
    WriteRows?: string;
    /** uint64 */
    WriteBytes?: string;
    /** uint64 */
    EraseRows?: string;
    /** uint64 */
    EraseBytes?: string;
    AffectedPartitions?: number;
    Extra?: unknown;
}

interface TDqExecutionStats {
    /** uint64 */
    CpuTimeUs?: string;
    /** uint64 */
    DurationUs?: string;
    /** uint64 */
    ResultRows?: string;
    /** uint64 */
    ResultBytes?: string;

    Tables?: TDqTableStats[];

    /** uint64 */
    ExecuterCpuTimeUs?: string;
    /** uint64 */
    StartTimeMs?: string;
    /** uint64 */
    FinishTimeMs?: string;
    /** uint64 */
    FirstRowTimeMs?: string;

    Stages?: TDqStageStats[];
    TxPlansWithStats?: string[];

    Extra: unknown;
}

interface TKqpStatsQuery {
    /** uint64 */
    DurationUs?: string;
    Compilation?: TKqpStatsCompile;

    /** uint64 */
    WorkerCpuTimeUs?: string;
    /** uint64 */
    ReadSetsCount?: string;
    /** uint64 */
    MaxShardProgramSize?: string;
    /** uint64 */
    MaxShardReplySize?: string;

    Executions?: TDqExecutionStats[];
}

// ==== Self-written types ====
// ==== Schema v0.2 ====

// ==== Plan ====
export interface PlanMeta {
    version: string;
    type: 'script' | 'query';
}

interface PlanTable {
    name: string;
    reads?: {
        type: string;
        columns?: string[];
        limit?: string;
        scan_by?: string[];
    }[];
    writes?: {
        type: string;
        columns?: string[];
    }[];
}

interface PlanNodeStats {
    TotalCpuTimeUs?: number;
    TotalTasks?: number;
    TotalInputBytes?: number;
    TotalInputRows?: number;
    TotalOutputBytes?: number;
    TotalDurationMs?: number;
    TotalOutputRows?: number;
}

interface PlanNodeOperator {
    Name: string;
    Limit?: string;
    ReadLimit?: string;
    ReadColumns?: string[];
    ReadRanges?: string[];
    Table?: string;
    Iterator?: string;
}

export interface PlanNode {
    PlanNodeId?: number;
    'Node Type'?: string;
    Plans?: PlanNode[];
    Operators?: PlanNodeOperator[];
    Tables?: string[];
    PlanNodeType?: string;
    Stats?: PlanNodeStats;
    'CTE Name'?: string;
    'Subplan Name'?: string;
    'Parent Relationship'?: string;
}

interface ScriptPlan {
    queries: {
        Plan: PlanNode;
        tables?: PlanTable[];
    }[];
    meta: PlanMeta;
}

interface ScanPlan {
    Plan: PlanNode;
    tables: PlanTable[];
    meta: PlanMeta;
}

// ====================
// common

type Plan = ScanPlan | ScriptPlan;
type AST = string;
type Stats = TKqpStatsQuery;

export interface CommonFields {
    ast?: AST;
    plan?: Plan;
    stats?: Stats;
}

interface DeprecatedCommonFields {
    stats?: Stats;
}

export interface ErrorResponse {
    error?: IssueMessage;
    issues?: IssueMessage[];
}

export type ExecuteActions = 'execute-script' | 'execute' | 'execute-scan' | undefined;
export type ExplainActions = 'explain' | 'explain-ast';
export type Actions = ExecuteActions | ExplainActions;

// undefined == 'classic'
export type Schemas = 'classic' | 'modern' | 'ydb' | undefined;

// ==== EXECUTE ====

// common types

export type CellValue = string | number | null | undefined;

export type KeyValueRow<T = CellValue> = {
    [key: string]: T;
};

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

// prettier-ignore
type ExecuteResponse<Schema extends Schemas> =
    | CommonFields // result can be undefined for queries like `insert into`
    | (Schema extends 'modern'
          ? ExecuteModernResponse
          : Schema extends 'ydb'
            ? ExecuteYdbResponse
            : Schema extends 'classic' | undefined
                ? ExecuteClassicResponse
                : unknown);

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

export type DeprecatedExecuteResponse =
    | DeprecatedExecuteResponseDeep
    | DeprecatedExecuteResponsePlain;

// ==== EXPLAIN ====

// modern response

type ExplainResponse = CommonFields;

// deprecated response from older versions, backward compatibility

// prettier-ignore
type DeprecatedExplainResponse<Action extends ExplainActions> = 
    Action extends 'explain-ast'
        ? ({result: {ast: AST}} & Required<DeprecatedCommonFields>) | {ast: AST}
        : Action extends 'explain'
            ? ({result: Plan} & Required<DeprecatedCommonFields>) | Plan
    : unknown;

// ==== COMBINED API RESPONSE ====

export type QueryAPIExecuteResponse<Schema extends Schemas = undefined> =
    | ExecuteResponse<Schema>
    | DeprecatedExecuteResponse
    | null;

export type QueryAPIExplainResponse<Action extends ExplainActions> =
    | ExplainResponse
    | DeprecatedExplainResponse<Action>
    | null;

// prettier-ignore
export type QueryAPIResponse<Action extends Actions, Schema extends Schemas = undefined> = 
    Action extends ExecuteActions
        ? QueryAPIExecuteResponse<Schema>
        : Action extends ExplainActions
            ? QueryAPIExplainResponse<Action>
            : unknown;

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

export type AnyExplainResponse =
    | ExplainResponse
    | CommonFields
    | DeprecatedExplainResponse<'explain'>
    | DeprecatedExplainResponse<'explain-ast'>
    | null;

export type AnyResponse = AnyExecuteResponse | AnyExplainResponse;
