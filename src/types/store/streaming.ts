import type {EStatusCode, ExecMode, ExecStatus} from '../api/operations';
import type {
    ArrayRow,
    ColumnType,
    ErrorResponse,
    IssueMessage,
    QueryPlan,
    ScriptPlan,
    TKqpStatsQuery,
} from '../api/query';

export interface SessionChunk {
    meta: {
        event: 'SessionCreated';
        node_id: number;
        query_id: string;
        session_id: string;

        // Custom client-set property.
        trace_id?: string;
    };
}

export interface ScriptResponseChunk {
    status: EStatusCode;
    exec_status: ExecStatus;
    exec_mode: ExecMode;

    operation_id?: string;
    execution_id?: string;

    issues?: {
        issues?: IssueMessage[];
    };

    meta?: {
        event: 'ScriptResponse';
    };
}

export interface OperationResponseChunk {
    meta?: {
        event: 'OperationResponse';
    };
    ready: boolean;
    id: string;
}

export interface KeepAliveChunk {
    meta: {
        event: 'KeepAlive';
    };
}

export interface StreamDataChunk {
    meta: {
        event: 'StreamData';
        seq_no: number;
        result_index: number;
    };
    result: {
        columns?: ColumnType[];
        rows: ArrayRow[] | null;
        truncated?: boolean;
    };
}

export interface SuccessQueryResponseData {
    stats?: TKqpStatsQuery;
    plan?: ScriptPlan | QueryPlan;
    ast?: string;
}

export type ErrorQueryResponseData = ErrorResponse;

export interface BaseQueryResponseChunk {
    meta: {
        event: 'QueryResponse';
        version: string;
        type: string;
    };
}

export type QueryResponseChunk = BaseQueryResponseChunk &
    (SuccessQueryResponseData | ErrorQueryResponseData);

export type StreamingChunk =
    | SessionChunk
    | ScriptResponseChunk
    | OperationResponseChunk
    | StreamDataChunk
    | QueryResponseChunk
    | KeepAliveChunk;
