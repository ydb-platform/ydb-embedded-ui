import type Monaco from 'monaco-editor';

export interface QueryExecution {
    text: string;
    range?: Monaco.IRange;
}
