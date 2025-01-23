export type SnippetLanguage =
    | 'bash'
    | 'cpp'
    | 'csharp'
    | 'go'
    | 'java'
    | 'javascript'
    | 'php'
    | 'python';

export interface SnippetParams {
    database?: string;
    endpoint?: string;
}
