import React from 'react';

import type {AcceptEvent, DeclineEvent, IgnoreEvent, PromptFile} from '@ydb-platform/monaco-ghost';
import type Monaco from 'monaco-editor';

import {codeAssistApi} from '../../../../store/reducers/codeAssist/codeAssist';
import type {TelemetryOpenTabs} from '../../../../types/api/codeAssist';
import {AUTOCOMPLETE_ON_ENTER, ENABLE_AUTOCOMPLETE} from '../../../../utils/constants';
import {useSetting} from '../../../../utils/hooks';
import {YQL_LANGUAGE_ID} from '../../../../utils/monaco/constats';

const limitForTab = 10_000;
const limitBeforeCursor = 8_000;
const limitAfterCursor = 1_000;

export type EditorOptions = Monaco.editor.IEditorOptions & Monaco.editor.IGlobalEditorOptions;

const EDITOR_OPTIONS: EditorOptions = {
    automaticLayout: true,
    selectOnLineNumbers: true,
    minimap: {
        enabled: false,
    },
    fixedOverflowWidgets: true,
};

export function useEditorOptions() {
    const [enableAutocomplete] = useSetting(ENABLE_AUTOCOMPLETE);
    const [autocompleteOnEnter] = useSetting(AUTOCOMPLETE_ON_ENTER);

    const options = React.useMemo<EditorOptions>(() => {
        const useAutocomplete = Boolean(enableAutocomplete);
        return {
            quickSuggestions: useAutocomplete,
            suggestOnTriggerCharacters: useAutocomplete,
            acceptSuggestionOnEnter: autocompleteOnEnter ? 'on' : 'off',
            ...EDITOR_OPTIONS,
        };
    }, [enableAutocomplete, autocompleteOnEnter]);

    return options;
}

export function useCodeAssist() {
    const [sendCodeAssistPrompt] = codeAssistApi.useLazyGetCodeAssistSuggestionsQuery();
    const [acceptSuggestion] = codeAssistApi.useAcceptSuggestionMutation();
    const [discardSuggestion] = codeAssistApi.useDiscardSuggestionMutation();
    const [ignoreSuggestion] = codeAssistApi.useIgnoreSuggestionMutation();
    const [sendUserQueriesData] = codeAssistApi.useSendUserQueriesDataMutation();

    const getCodeAssistSuggestions = React.useCallback(
        async (promptFiles: PromptFile[]) => sendCodeAssistPrompt(promptFiles).unwrap(),
        [sendCodeAssistPrompt],
    );

    const onCompletionAccept = React.useCallback(
        async (event: AcceptEvent) => acceptSuggestion(event).unwrap(),
        [acceptSuggestion],
    );

    const onCompletionDecline = React.useCallback(
        async (event: DeclineEvent) => discardSuggestion(event).unwrap(),
        [discardSuggestion],
    );

    const onCompletionIgnore = React.useCallback(
        async (event: IgnoreEvent) => ignoreSuggestion(event).unwrap(),
        [ignoreSuggestion],
    );

    const prepareUserQueriesCache = React.useCallback(
        async (queries: {text: string; name?: string}[]) => {
            const preparedData: TelemetryOpenTabs = queries.map((query, index) => ({
                FileName: query.name || `query${index}.yql`,
                Text: query.text.slice(0, limitForTab),
            }));
            try {
                return sendUserQueriesData(preparedData).unwrap();
            } catch {
                return {items: []};
            }
        },
        [sendUserQueriesData],
    );

    const config = {
        language: YQL_LANGUAGE_ID,
        textLimits: {
            beforeCursor: limitBeforeCursor,
            afterCursor: limitAfterCursor,
        },
    };

    return {
        config,
        getCodeAssistSuggestions,
        onCompletionAccept,
        onCompletionDecline,
        onCompletionIgnore,
        prepareUserQueriesCache,
    };
}
