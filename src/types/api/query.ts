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

export interface TKqpStatsQuery {
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

export interface PlanTable {
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

export interface ScriptPlan {
    queries?: {
        Plan: PlanNode;
        tables?: PlanTable[];
    }[];
    meta: PlanMeta;
}

export interface ScanPlan {
    Plan?: PlanNode;
    tables?: PlanTable[];
    meta: PlanMeta;
}

// ==== Common ====

export type CellValue = string | number | null | undefined;

export type KeyValueRow<T = CellValue> = {
    [key: string]: T;
};

export type ArrayRow<T = CellValue> = Array<T>;

export interface ColumnType {
    name: string;
    type: string;
}

/** undefined = 'classic' */
export type Schemas = 'classic' | 'modern' | 'ydb' | undefined;

/**
 * undefined = 'execute'
 *
 * execute and execute-script have similar responses
 */
export type ExecuteActions = 'execute' | 'execute-scan' | 'execute-script' | undefined;

/** explain, explain-scan and explain-ast have similar responses */
export type ExplainActions = 'explain' | 'explain-scan' | 'explain-script' | 'explain-ast';

export type Actions = ExecuteActions | ExplainActions;

// ==== Error response ====
export interface ErrorResponse {
    error?: IssueMessage;
    issues?: IssueMessage[];
}

// ==== Explain Response ====

export interface ExplainScriptResponse {
    plan?: ScriptPlan;
}

export interface ExplainScanResponse {
    ast?: string;
    plan?: ScanPlan;
}

export type ExplainResponse<Action extends ExplainActions> = Action extends 'explain-script'
    ? ExplainScriptResponse
    : ExplainScanResponse;

// ==== Execute Response ====

type ResultFields<Schema extends Schemas> = Schema extends 'modern'
    ? {
          result?: ArrayRow[];
          columns?: ColumnType[];
      }
    : {
          result?: KeyValueRow[];
      };

export type ExecuteScanResponse<Schema extends Schemas> = ResultFields<Schema>;

export type ExecuteScriptResponse<Schema extends Schemas> = {
    plan?: ScriptPlan;
    ast?: string;
    stats?: TKqpStatsQuery;
} & ResultFields<Schema>;

export type ExecuteResponse<
    Schema extends Schemas,
    Action extends ExecuteActions,
> = Action extends 'execute-scan' ? ExecuteScanResponse<Schema> : ExecuteScriptResponse<Schema>;

// ==== Combined API response ====
export type QueryAPIResponse<
    Schema extends Schemas,
    Action extends Actions,
> = Action extends ExplainActions
    ? ExplainResponse<Action>
    : Action extends ExecuteActions
    ? ExecuteResponse<Schema, Action>
    : unknown;

// ==== types to use in query result preparation ====
export type AnyExplainResponse = ExplainScanResponse | ExplainScriptResponse;

export type ExecuteModernResponse = ExecuteScanResponse<'modern'> | ExecuteScriptResponse<'modern'>;
export type ExecuteClassicResponse =
    | ExecuteScanResponse<'classic'>
    | ExecuteScriptResponse<'classic'>;
export type ExecuteYdbResponse = ExecuteScanResponse<'ydb'> | ExecuteScriptResponse<'ydb'>;

export type AnyExecuteResponse =
    | ExecuteModernResponse
    | ExecuteClassicResponse
    | ExecuteYdbResponse;
