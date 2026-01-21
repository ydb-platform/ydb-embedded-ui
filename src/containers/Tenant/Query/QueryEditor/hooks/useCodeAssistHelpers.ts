import React from 'react';

import type {AcceptEvent, DeclineEvent, IgnoreEvent, PromptFile} from '@ydb-platform/monaco-ghost';

import {codeAssistApi} from '../../../../../store/reducers/codeAssist/codeAssist';
import type {QueryInHistory} from '../../../../../store/reducers/query/types';
import type {TelemetryOpenTabs} from '../../../../../types/api/codeAssist';
import {YQL_LANGUAGE_ID} from '../../../../../utils/monaco/constats';
import {useSavedQueries} from '../../utils/useSavedQueries';

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
