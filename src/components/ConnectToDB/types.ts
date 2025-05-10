export type SnippetLanguage =
    | 'bash'
    | 'cpp'
    | 'csharp'
    | 'go_native_sdk'
    | 'go_database_sql'
    | 'java'
    | 'javascript'
    | 'php'
    | 'python';

export interface SnippetParams {
    database?: string;
    endpoint?: string;
}
