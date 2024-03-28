import * as monaco from 'monaco-editor';
import {createProvideSuggestionsFunction} from './yqlSuggestions';

let completionProvider: monaco.IDisposable | undefined;

function disableCodeSuggestions(): void {
    if (completionProvider) {
        completionProvider.dispose();
    }
}

export function registerYQLCompletionItemProvider(database: string) {
    disableCodeSuggestions();
    completionProvider = monaco.languages.registerCompletionItemProvider('sql', {
        triggerCharacters: [' ', '\n', '', ',', '.', '`', '('],
        provideCompletionItems: createProvideSuggestionsFunction(database),
    });
}
