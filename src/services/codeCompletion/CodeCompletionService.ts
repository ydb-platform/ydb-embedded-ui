import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import {getPromptFileContent} from './promptContent';
import type {
    CodeCompletionConfig,
    DiscardReason,
    EnrichedCompletion,
    ICodeCompletionAPI,
    ICodeCompletionService,
    ITelemetryService,
    InternalSuggestion,
} from './types';

const DEFAULT_CONFIG: Required<CodeCompletionConfig> = {
    debounceTime: 200,
    textLimits: {
        beforeCursor: 8000,
        afterCursor: 1000,
    },
    telemetry: {
        enabled: true,
    },
    suggestionCache: {
        enabled: true,
    },
};

export class CodeCompletionService implements ICodeCompletionService {
    private prevSuggestions: InternalSuggestion[] = [];
    private timer: number | null = null;
    private readonly api: ICodeCompletionAPI;
    private readonly telemetry: ITelemetryService;
    private readonly config: Required<CodeCompletionConfig>;

    constructor(
        api: ICodeCompletionAPI,
        telemetry: ITelemetryService,
        userConfig?: CodeCompletionConfig,
    ) {
        this.api = api;
        this.telemetry = telemetry;
        // Merge user config with defaults, ensuring all properties exist
        this.config = {
            ...DEFAULT_CONFIG,
            ...userConfig,
            textLimits: {
                ...DEFAULT_CONFIG.textLimits,
                ...(userConfig?.textLimits || {}),
            },
            telemetry: {
                ...DEFAULT_CONFIG.telemetry,
                ...(userConfig?.telemetry || {}),
            },
            suggestionCache: {
                ...DEFAULT_CONFIG.suggestionCache,
                ...(userConfig?.suggestionCache || {}),
            },
        };
    }

    handleItemDidShow(
        _completions: monaco.languages.InlineCompletions<EnrichedCompletion>,
        item: EnrichedCompletion,
    ) {
        if (!this.config.suggestionCache.enabled) {
            return;
        }

        for (const suggests of this.prevSuggestions) {
            for (const completion of suggests.items) {
                if (completion.pristine === item.pristine) {
                    suggests.shownCount++;
                    break;
                }
            }
        }
    }

    async provideInlineCompletions(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        _context: monaco.languages.InlineCompletionContext,
        _token: monaco.CancellationToken,
    ) {
        if (this.config.suggestionCache.enabled) {
            const cachedCompletions = this.getCachedCompletion(model, position);
            if (cachedCompletions.length) {
                return {items: cachedCompletions};
            }
        }

        while (this.prevSuggestions.length > 0) {
            this.dismissCompletion(this.prevSuggestions.pop());
        }
        const {suggestions, requestId} = await this.getSuggestions(model, position);

        this.prevSuggestions = [{items: suggestions, shownCount: 0, requestId}];
        return {
            items: suggestions,
        };
    }

    handlePartialAccept(
        _completions: monaco.languages.InlineCompletions,
        item: monaco.languages.InlineCompletion,
        acceptedLetters: number,
    ) {
        const {command} = item;
        const commandArguments = command?.arguments?.[0] ?? {};
        const {suggestionText, requestId, prevWordLength = 0} = commandArguments;
        const cachedSuggestions = this.prevSuggestions.find((el) => {
            return el.items.some((item) => item.pristine === suggestionText);
        });
        if (requestId && suggestionText && typeof item.insertText === 'string') {
            const acceptedText = item.insertText.slice(prevWordLength, acceptedLetters);
            if (acceptedText) {
                if (cachedSuggestions) {
                    cachedSuggestions.wasAccepted = true;
                }
                this.telemetry.sendAcceptTelemetry(requestId, acceptedText);
            }
        }
    }

    handleAccept({requestId, suggestionText}: {requestId: string; suggestionText: string}) {
        this.emptyCache();
        this.telemetry.sendAcceptTelemetry(requestId, suggestionText);
    }

    commandDiscard(
        reason: DiscardReason = 'OnCancel',
        editor: monaco.editor.IStandaloneCodeEditor,
    ): void {
        while (this.prevSuggestions.length > 0) {
            this.discardCompletion(reason, this.prevSuggestions.pop());
        }
        editor.trigger(undefined, 'editor.action.inlineSuggest.hide', undefined);
    }

    emptyCache() {
        this.prevSuggestions = [];
    }

    freeInlineCompletions(): void {
        // This method is required by Monaco's InlineCompletionsProvider interface
        // but we don't need to do anything here since we handle cleanup in other methods
    }

    private getCachedCompletion(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
    ): EnrichedCompletion[] {
        const completions: EnrichedCompletion[] = [];
        for (const suggests of this.prevSuggestions) {
            for (const completion of suggests.items) {
                if (!completion.range) {
                    continue;
                }
                if (
                    position.lineNumber < completion.range.startLineNumber ||
                    position.column < completion.range.startColumn
                ) {
                    continue;
                }
                const startCompletionPosition = new monaco.Position(
                    completion.range.startLineNumber,
                    completion.range.startColumn,
                );
                const startOffset = model.getOffsetAt(startCompletionPosition);
                const endOffset = startOffset + completion.insertText.toString().length;
                const positionOffset = model.getOffsetAt(position);
                if (positionOffset > endOffset) {
                    continue;
                }

                const completionReplaceText = completion.insertText
                    .toString()
                    .slice(0, positionOffset - startOffset);

                const newRange = new monaco.Range(
                    completion.range.startLineNumber,
                    completion.range.startColumn,
                    position.lineNumber,
                    position.column,
                );
                const currentReplaceText = model.getValueInRange(newRange);
                if (completionReplaceText.toLowerCase() === currentReplaceText.toLowerCase()) {
                    completions.push({
                        insertText:
                            currentReplaceText +
                            completion.insertText.toString().slice(positionOffset - startOffset),
                        range: newRange,
                        command: completion.command,
                        pristine: completion.pristine,
                    });
                }
            }
        }
        return completions;
    }

    private async getSuggestions(model: monaco.editor.ITextModel, position: monaco.Position) {
        if (this.timer) {
            window.clearTimeout(this.timer);
        }
        await new Promise((r) => {
            this.timer = window.setTimeout(r, this.config.debounceTime);
        });
        let suggestions: EnrichedCompletion[] = [];
        let requestId = '';
        try {
            const data = getPromptFileContent(model, position, {
                beforeCursor: this.config.textLimits.beforeCursor,
                afterCursor: this.config.textLimits.afterCursor,
            });
            if (!data) {
                return {suggestions: []};
            }

            const codeAssistSuggestions = await this.api.getCodeAssistSuggestions(data);
            requestId = codeAssistSuggestions.RequestId;
            const {word, startColumn: lastWordStartColumn} = model.getWordUntilPosition(position);
            suggestions = codeAssistSuggestions.Suggests.map((el) => {
                const suggestionText = el.Text;
                const label = word + suggestionText;
                return {
                    label: label,
                    sortText: 'a',
                    insertText: label,
                    pristine: suggestionText,
                    range: new monaco.Range(
                        position.lineNumber,
                        lastWordStartColumn,
                        position.lineNumber,
                        position.column,
                    ),
                    command: {
                        id: 'acceptCodeAssistCompletion',
                        title: '',
                        arguments: [
                            {
                                requestId,
                                suggestionText: suggestionText,
                                prevWordLength: word.length,
                            },
                        ],
                    },
                };
            });
        } catch (err) {}
        return {suggestions, requestId};
    }

    private discardCompletion(reason: DiscardReason, completion?: InternalSuggestion): void {
        if (completion === undefined) {
            return;
        }
        const {requestId, items, shownCount} = completion;
        if (!requestId || !items.length) {
            return;
        }
        for (const item of items) {
            this.telemetry.sendDeclineTelemetry(requestId, item.pristine, reason, shownCount);
        }
    }

    private dismissCompletion(completion?: InternalSuggestion): void {
        if (completion === undefined) {
            return;
        }
        const {requestId, items, shownCount, wasAccepted} = completion;

        if (!requestId || !items.length || !shownCount || wasAccepted) {
            return;
        }
        for (const item of items) {
            this.telemetry.sendIgnoreTelemetry(requestId, item.pristine);
        }
    }
}
