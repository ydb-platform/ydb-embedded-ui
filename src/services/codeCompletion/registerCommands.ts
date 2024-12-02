import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import type {ICodeCompletionService} from './types';

export function registerCompletionCommands(
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco,
    completionService: ICodeCompletionService,
) {
    monacoInstance.editor.registerCommand('acceptCodeAssistCompletion', (_accessor, ...args) => {
        const data = args[0] ?? {};
        if (!data || typeof data !== 'object') {
            return;
        }
        const {requestId, suggestionText} = data;
        if (requestId && suggestionText) {
            completionService.handleAccept({requestId, suggestionText});
        }
    });

    monacoInstance.editor.registerCommand('declineCodeAssistCompletion', () => {
        completionService.commandDiscard();
    });
}
