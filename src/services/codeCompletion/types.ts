import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import type {
    DiscardReason,
    PromptFile,
    Suggestions,
    TelemetryEvent,
} from '../../types/api/codeAssistant';

export interface ICodeCompletionAPI {
    getCodeAssistSuggestions(data: PromptFile[]): Promise<Suggestions>;
    sendCodeAssistTelemetry(data: TelemetryEvent): Promise<unknown>;
}

export interface ITelemetryService {
    sendAcceptTelemetry(requestId: string, acceptedText: string): void;
    sendDeclineTelemetry(
        requestId: string,
        suggestionText: string,
        reason: DiscardReason,
        hitCount: number,
    ): void;
    sendIgnoreTelemetry(requestId: string, suggestionText: string): void;
}

export interface EnrichedCompletion extends monaco.languages.InlineCompletion {
    pristine: string;
}

export interface InternalSuggestion {
    items: EnrichedCompletion[];
    requestId?: string;
    shownCount: number;
    wasAccepted?: boolean;
}

export interface ICodeCompletionService extends monaco.languages.InlineCompletionsProvider {
    handleItemDidShow(
        completions: monaco.languages.InlineCompletions<EnrichedCompletion>,
        item: EnrichedCompletion,
    ): void;
    handlePartialAccept(
        completions: monaco.languages.InlineCompletions,
        item: monaco.languages.InlineCompletion,
        acceptedLetters: number,
    ): void;
    handleAccept(params: {requestId: string; suggestionText: string}): void;
    commandDiscard(reason?: DiscardReason): void;
    emptyCache(): void;
}
