import React from 'react';

import type {AcceptEvent, DeclineEvent, IgnoreEvent, PromptFile} from '@ydb-platform/monaco-ghost';
import type Monaco from 'monaco-editor';

import {codeAssistApi} from '../../../../store/reducers/codeAssist/codeAssist';
import type {QueryInHistory} from '../../../../store/reducers/query/types';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import type {TelemetryOpenTabs} from '../../../../types/api/codeAssist';
import {useSetting} from '../../../../utils/hooks';
import {YQL_LANGUAGE_ID} from '../../../../utils/monaco/constats';
import {useSavedQueries} from '../utils/useSavedQueries';

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
    const [enableAutocomplete] = useSetting(SETTING_KEYS.ENABLE_AUTOCOMPLETE);
    const [autocompleteOnEnter] = useSetting(SETTING_KEYS.AUTOCOMPLETE_ON_ENTER);

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

export function useCodeAssistHelpers(historyQueries: QueryInHistory[]) {
    const [sendCodeAssistPrompt] = codeAssistApi.useLazyGetCodeAssistSuggestionsQuery();
    const [acceptSuggestion] = codeAssistApi.useAcceptSuggestionMutation();
    const [discardSuggestion] = codeAssistApi.useDiscardSuggestionMutation();
    const [ignoreSuggestion] = codeAssistApi.useIgnoreSuggestionMutation();
    const [sendUserQueriesData] = codeAssistApi.useSendUserQueriesDataMutation();
    const {savedQueries} = useSavedQueries();

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
            ...(savedQueries ?? []).map((query) => ({
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

type AbortablePromiseLike = {abort: VoidFunction} & PromiseLike<unknown>;

class QueryManager {
    private readonly queries = new Map<string, {abort: VoidFunction}>();

    registerQuery(tabId: string, query: AbortablePromiseLike) {
        this.queries.set(tabId, query);

        const queryRef = query;
        Promise.resolve(query).finally(() => {
            if (this.queries.get(tabId) === queryRef) {
                this.queries.delete(tabId);
            }
        });
    }

    abortQuery(tabId: string) {
        const query = this.queries.get(tabId);
        if (query) {
            query.abort();
            this.queries.delete(tabId);
        }
    }

    abortAll() {
        for (const query of this.queries.values()) {
            query.abort();
        }
        this.queries.clear();
    }
}

export const queryManagerInstance = new QueryManager();
