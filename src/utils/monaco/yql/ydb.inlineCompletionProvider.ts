import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import type {DiscardReason} from '../../../types/api/codeAssistant';
import {getPromptFileContent, sendCodeAssistTelemetry} from '../codeAssistTelemetry';

interface InternalSuggestion {
    items: EnrichedCompletion[];
    requestId?: string;
    shownCount: number;
    wasAccepted?: boolean;
}

interface EnrichedCompletion extends monaco.languages.InlineCompletion {
    pristine: string;
}

class InlineCompletionProvider implements monaco.languages.InlineCompletionsProvider {
    private prevSuggestions: InternalSuggestion[] = [];
    private timer: number | null = null;

    handleItemDidShow(
        _completions: monaco.languages.InlineCompletions<EnrichedCompletion>,
        item: EnrichedCompletion,
    ) {
        for (const suggests of this.prevSuggestions) {
            for (const completion of suggests.items) {
                if (completion.pristine === item.pristine) {
                    suggests.shownCount++;
                    break;
                }
            }
        }
    }

    getCachedCompletion(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
    ): EnrichedCompletion[] {
        const completions: EnrichedCompletion[] = [];
        for (const suggests of this.prevSuggestions) {
            for (const completion of suggests.items) {
                if (!completion.range) {
                    continue;
                }
                //can't use `model.getOffsetAt` because completion position will be ajusted is such a case and will be set as cursor position
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

    async provideInlineCompletions(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        _context: monaco.languages.InlineCompletionContext,
        _token: monaco.CancellationToken,
    ) {
        const cachedCompletions = this.getCachedCompletion(model, position);
        if (cachedCompletions.length) {
            return {items: cachedCompletions};
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

    async getSuggestions(model: monaco.editor.ITextModel, position: monaco.Position) {
        //monaco don't have instruments to debaunce inline completions, this is a workaround
        if (this.timer) {
            window.clearTimeout(this.timer);
        }
        await new Promise((r) => {
            this.timer = window.setTimeout(r, 400);
        });
        let suggestions: EnrichedCompletion[] = [];
        let requestId = '';
        try {
            const data = getPromptFileContent(model, position);
            if (!data) {
                return {suggestions: []};
            }

            const codeAssistSuggestions =
                await window.api.codeAssistant!.getCodeAssistSuggestions(data);
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

    freeInlineCompletions() {}

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
                sendCodeAssistTelemetry({type: 'accept', acceptedText, requestId});
            }
        }
    }
    handleAccept({requestId, suggestionText}: {requestId: string; suggestionText: string}) {
        this.emptyCache();
        sendCodeAssistTelemetry({type: 'accept', requestId, acceptedText: suggestionText});
    }

    commandDiscard(reason: DiscardReason = 'OnCancel'): void {
        const editor = window.ydbEditor;
        while (this.prevSuggestions.length > 0) {
            this.discardCompletion(reason, this.prevSuggestions.pop());
        }
        if (editor) {
            editor.trigger(undefined, 'editor.action.inlineSuggest.hide', undefined);
        }
    }

    emptyCache() {
        this.prevSuggestions = [];
    }

    discardCompletion(reason: DiscardReason, completion?: InternalSuggestion): void {
        if (completion === undefined) {
            return;
        }
        const {requestId, items, shownCount} = completion;
        if (!requestId || !items.length) {
            return;
        }
        for (const item of items) {
            sendCodeAssistTelemetry({
                type: 'decline',
                requestId,
                suggestionText: item.pristine,
                reason,
                hitCount: shownCount,
            });
        }
    }

    dismissCompletion(completion?: InternalSuggestion): void {
        if (completion === undefined) {
            return;
        }
        const {requestId, items, shownCount, wasAccepted} = completion;

        //if showCount === 0 or item was already partially accepted, should not send telemetry
        if (!requestId || !items.length || !shownCount || wasAccepted) {
            return;
        }
        for (const item of items) {
            sendCodeAssistTelemetry({type: 'ignore', suggestionText: item.pristine, requestId});
        }
    }
}

export const inlineCompletionProviderInstance = new InlineCompletionProvider();
