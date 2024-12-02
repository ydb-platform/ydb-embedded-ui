import * as monaco from 'monaco-editor';
import {LANGUAGE_ID} from 'monaco-yql-languages/build/yql/yql.contribution';

import {createCompletionProvider} from '../../../services/codeCompletion/factory';
import type {
    ICodeCompletionAPI,
    ICodeCompletionService,
} from '../../../services/codeCompletion/types';

let inlineProvider: monaco.IDisposable | undefined;

function disableCodeSuggestions(): void {
    if (inlineProvider) {
        inlineProvider.dispose();
    }
}

let completionProviderInstance: ICodeCompletionService | null = null;

export function getCompletionProvider(): ICodeCompletionService | null {
    return completionProviderInstance;
}

export function registerInlineCompletionProvider(api: ICodeCompletionAPI) {
    disableCodeSuggestions();

    completionProviderInstance = createCompletionProvider(api);

    inlineProvider = monaco.languages.registerInlineCompletionsProvider(
        LANGUAGE_ID,
        completionProviderInstance,
    );
}
