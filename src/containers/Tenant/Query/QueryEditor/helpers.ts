import React from 'react';

import type {AcceptEvent, DeclineEvent, IgnoreEvent, PromptFile} from '@ydb-platform/monaco-ghost';
import type Monaco from 'monaco-editor';

import {codeAssistApi} from '../../../../store/reducers/codeAssist/codeAssist';
import type {TelemetryOpenTabs} from '../../../../types/api/codeAssist';
import {AUTOCOMPLETE_ON_ENTER, ENABLE_AUTOCOMPLETE} from '../../../../utils/constants';
import {useSetting} from '../../../../utils/hooks';

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
        async (promptFiles: PromptFile[]) => {
            try {
                return sendCodeAssistPrompt(promptFiles).unwrap();
            } catch {
                return {items: []};
            }
        },
        [sendCodeAssistPrompt],
    );

    const onCompletionAccept = React.useCallback(
        async (event: AcceptEvent) => {
            try {
                return acceptSuggestion(event).unwrap();
            } catch {
                return {items: []};
            }
        },
        [acceptSuggestion],
    );

    const onCompletionDecline = React.useCallback(
        async (event: DeclineEvent) => {
            try {
                return discardSuggestion(event).unwrap();
            } catch {
                return {items: []};
            }
        },
        [discardSuggestion],
    );

    const onCompletionIgnore = React.useCallback(
        async (event: IgnoreEvent) => {
            try {
                return ignoreSuggestion(event).unwrap();
            } catch {
                return {items: []};
            }
        },
        [ignoreSuggestion],
    );

    const prepareUserQueriesCache = React.useCallback(
        async (queries: {text: string; name?: string}[]) => {
            const preparedData: TelemetryOpenTabs = queries.map((query, index) => ({
                FileName: query.name || `query${index}.yql`,
                Text: query.text,
            }));
            try {
                return sendUserQueriesData(preparedData).unwrap();
            } catch {
                return {items: []};
            }
        },
        [sendUserQueriesData],
    );

    return {
        getCodeAssistSuggestions,
        onCompletionAccept,
        onCompletionDecline,
        onCompletionIgnore,
        prepareUserQueriesCache,
    };
}
