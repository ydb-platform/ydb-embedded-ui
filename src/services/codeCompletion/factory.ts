import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import {CodeCompletionService} from './CodeCompletionService';
import {TelemetryService} from './TelemetryService';
import type {ICodeCompletionAPI} from './types';

export function createCompletionProvider(
    api: ICodeCompletionAPI,
    editor?: monaco.editor.IStandaloneCodeEditor,
) {
    const telemetryService = new TelemetryService((data) => api.sendCodeAssistTelemetry(data));
    return new CodeCompletionService(api, telemetryService, editor);
}
