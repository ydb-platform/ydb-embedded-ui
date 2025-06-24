// IMPORTANT!
// In the future code assist api will be provided to ydb-ui component explicitly by consumer service.
// Current solution is temporary and aimed to satisfy internal puproses.
// It means this whole file will be moved to customer service

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

const limitForTab = 10_000;
const limitBeforeCursor = 8_000;
const limitAfterCursor = 1_000;

function prepareCodeAssistTabs(tabs: TelemetryOpenTabs): TelemetryOpenTabs {
    return tabs.map((tab) => {
        const text = tab.Text;
        if (text.length > limitForTab) {
            return {
                ...tab,
                Text: text.slice(0, limitForTab),
            };
        }

        return tab;
    });
}

function prepareCodeAssistPrompt(promptFiles: PromptFile[]): CodeAssistSuggestionsFiles {
    return promptFiles.map((file) => {
        const cursorLine = file.cursorPosition.lineNumber;
        const cursorCol = file.cursorPosition.column;

        return {
            Fragments: file.fragments.map((fragment) => {
                let text = fragment.text;
                const isBeforeCursor =
                    fragment.end.lineNumber < cursorLine ||
                    (fragment.end.lineNumber === cursorLine && fragment.end.column <= cursorCol);
                const isAfterCursor =
                    fragment.start.lineNumber > cursorLine ||
                    (fragment.start.lineNumber === cursorLine && fragment.start.column > cursorCol);

                if (isBeforeCursor) {
                    text = text.slice(-limitBeforeCursor);
                } else if (isAfterCursor) {
                    text = text.slice(0, limitAfterCursor);
                }

                return {
                    Text: text,
                    Start: {
                        Ln: fragment.start.lineNumber,
                        Col: fragment.start.column,
                    },
                    End: {
                        Ln: fragment.end.lineNumber,
                        Col: fragment.end.column,
                    },
                };
            }),
            Cursor: {
                Ln: cursorLine,
                Col: cursorCol,
            },
            Path: `${file.path}.yql`,
        };
    });
}

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
        return this.post(this.getPath('/code-assist-telemetry'), data, null, {
            concurrentId: 'code-assist-telemetry',
            collectRequest: true,
        });
    }

    sendCodeAssistOpenTabs(data: TelemetryOpenTabs) {
        return this.post(
            this.getPath('/code-assist-telemetry'),
            {OpenTabs: {Tabs: prepareCodeAssistTabs(data), IdeInfo: ideInfo}},
            null,
            {
                concurrentId: 'code-assist-telemetry',
                collectRequest: false,
            },
        );
    }
}
