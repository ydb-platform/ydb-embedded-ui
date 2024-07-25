import * as monaco from 'monaco-editor';
import {LANGUAGE_ID} from 'monaco-yql-languages/build/yql/yql.contribution';

import {createProvideSuggestionsFunction} from './yqlSuggestions';

let completionProvider: monaco.IDisposable | undefined;

function disableCodeSuggestions(): void {
    if (completionProvider) {
        completionProvider.dispose();
    }
}

export function registerYQLCompletionItemProvider(database: string) {
    disableCodeSuggestions();
    completionProvider = monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, {
        triggerCharacters: [' ', '.', '`', '(', '/'],
        provideCompletionItems: createProvideSuggestionsFunction(database),
    });
}
