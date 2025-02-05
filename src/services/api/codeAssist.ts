import type {PromptFile, Suggestions} from '@ydb-platform/monaco-ghost';

import {codeAssistBackend as CODE_ASSISTANT_BACKEND} from '../../store';
import type {
    CodeAssistSuggestionsFiles,
    CodeAssistSuggestionsResponse,
    TelemetryEvent,
    TelemetryOpenTabs,
} from '../../types/api/codeAssist';

import {BaseYdbAPI} from './base';
const ideInfo = {
    Ide: 'ydb',
    IdeVersion: '1',
    PluginFamily: 'ydb',
    PluginVersion: '0.2',
};

function prepareCodeAssistPrompt(promptFiles: PromptFile[]): CodeAssistSuggestionsFiles {
    return promptFiles.map((file) => ({
        Fragments: file.fragments.map((fragment) => ({
            Text: fragment.text,
            Start: {
                Ln: fragment.start.lineNumber,
                Col: fragment.start.column,
            },
            End: {
                Ln: fragment.end.lineNumber,
                Col: fragment.end.column,
            },
        })),
        Cursor: {
            Ln: file.cursorPostion.lineNumber,
            Col: file.cursorPostion.column,
        },
        Path: `${file.path}.yql`,
    }));
}

// In the future code assist api will be provided to ydb-ui component explicitly by consumer service.
// Current solution is temporary and aimed to satisfy internal puproses.
export class CodeAssistAPI extends BaseYdbAPI {
    getPath(path: string) {
        return `${CODE_ASSISTANT_BACKEND ?? ''}${path}`;
    }

    async getCodeAssistSuggestions(data: PromptFile[]): Promise<Suggestions> {
        const request: CodeAssistSuggestionsFiles = prepareCodeAssistPrompt(data);

        const response = await this.post<CodeAssistSuggestionsResponse>(
            this.getPath('/code-assist-suggestion'),
            {
                Files: request,
                ContextCreateType: 1,
                IdeInfo: ideInfo,
            },
            null,
            {
                concurrentId: 'code-assist-suggestion',
                collectRequest: false,
            },
        );

        return {
            items: response.Suggests.map((suggestion) => suggestion.Text),
            requestId: response.RequestId,
        };
    }

    sendCodeAssistTelemetry(data: TelemetryEvent) {
        return this.post('/code-assist-telemetry', data, null, {
            concurrentId: 'code-assist-telemetry',
            collectRequest: true,
        });
    }

    sendCodeAssistOpenTabs(data: TelemetryOpenTabs) {
        return this.post(
            '/code-assist-telemetry',
            {OpenTabs: {Tabs: data, IdeInfo: ideInfo}},
            null,
            {
                concurrentId: 'code-assist-telemetry',
                collectRequest: false,
            },
        );
    }
}
