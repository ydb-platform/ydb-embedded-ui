import type Monaco from 'monaco-editor';

export type QueryExecutionSource = 'editor' | 'selection' | 'current-statement';

export interface QueryExecution {
    text: string;
    source: QueryExecutionSource;
    range?: Monaco.IRange;
}
