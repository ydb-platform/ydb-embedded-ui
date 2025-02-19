import type {
    ArrayRow,
    ColumnType,
    ErrorResponse,
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

export type StreamingChunk = SessionChunk | StreamDataChunk | QueryResponseChunk;
