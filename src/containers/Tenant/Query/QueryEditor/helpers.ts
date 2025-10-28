import React from 'react';

import type {AcceptEvent, DeclineEvent, IgnoreEvent, PromptFile} from '@ydb-platform/monaco-ghost';
import type Monaco from 'monaco-editor';

import {codeAssistApi} from '../../../../store/reducers/codeAssist/codeAssist';
import {selectQueriesHistory} from '../../../../store/reducers/query/query';
import type {TelemetryOpenTabs} from '../../../../types/api/codeAssist';
import type {SavedQuery} from '../../../../types/store/query';
import {
    AUTOCOMPLETE_ON_ENTER,
    ENABLE_AUTOCOMPLETE,
    SAVED_QUERIES_KEY,
} from '../../../../utils/constants';
import {useSetting, useTypedSelector} from '../../../../utils/hooks';
import {YQL_LANGUAGE_ID} from '../../../../utils/monaco/constats';

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

export function useCodeAssistHelpers() {
    const [sendCodeAssistPrompt] = codeAssistApi.useLazyGetCodeAssistSuggestionsQuery();
    const [acceptSuggestion] = codeAssistApi.useAcceptSuggestionMutation();
    const [discardSuggestion] = codeAssistApi.useDiscardSuggestionMutation();
    const [ignoreSuggestion] = codeAssistApi.useIgnoreSuggestionMutation();
    const [sendUserQueriesData] = codeAssistApi.useSendUserQueriesDataMutation();
    const historyQueries = useTypedSelector(selectQueriesHistory);
    const [savedQueries] = useSetting<SavedQuery[]>(SAVED_QUERIES_KEY, []);

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

    const userQueries = React.useMemo(() => {
        return [
            ...historyQueries.map((query, index) => ({
                name: `query${index}.yql`,
                text: query.queryText,
            })),
            ...savedQueries.map((query) => ({
                name: query.name,
                text: query.body,
            })),
        ];
    }, [historyQueries, savedQueries]);

    const prepareUserQueriesCache = React.useCallback(async () => {
        const preparedData: TelemetryOpenTabs = userQueries.map((query, index) => ({
            FileName: query.name || `query${index}.yql`,
            Text: query.text,
        }));
        try {
            return await sendUserQueriesData(preparedData).unwrap();
        } catch {
            return {items: []};
        }
    }, [sendUserQueriesData, userQueries]);

    const monacoGhostConfig = React.useMemo(() => {
        return {
            api: {
                getCodeAssistSuggestions,
            },
            eventHandlers: {
                onCompletionAccept,
                onCompletionDecline,
                onCompletionIgnore,
            },
            config: {
                language: YQL_LANGUAGE_ID,
            },
        };
    }, [getCodeAssistSuggestions, onCompletionAccept, onCompletionDecline, onCompletionIgnore]);

    return {
        prepareUserQueriesCache,
        monacoGhostConfig,
    };
}

class QueryManager {
    private query: {abort: VoidFunction} | null;

    constructor() {
        this.query = null;
    }

    registerQuery(query: {abort: VoidFunction}) {
        this.query = query;
    }

    abortQuery() {
        if (this.query) {
            this.query.abort();
            this.query = null;
        }
    }
}

export const queryManagerInstance = new QueryManager();
