import React from 'react';

import {
    useEventHandler,
    useSetting,
    useTypedDispatch,
    useTypedSelector,
} from '../../../utils/hooks';
import {SETTING_KEYS} from '../settings/constants';

import {
    changeUserInput,
    selectHistoryCurrentQueryId,
    selectQueriesHistoryFilter,
    setHistoryCurrentQueryId,
} from './query';
import type {QueryInHistory, QueryStats} from './types';
import {getQueryInHistory} from './utils';

const MAXIMUM_QUERIES_IN_HISTORY = 20;

export function useQueriesHistory() {
    const dispatch = useTypedDispatch();
    const queriesFilter = useTypedSelector(selectQueriesHistoryFilter);
    const historyCurrentQueryId = useTypedSelector(selectHistoryCurrentQueryId);

    const [savedHistoryQueries, saveHistoryQueries] = useSetting<QueryInHistory[]>(
        SETTING_KEYS.QUERIES_HISTORY,
    );

    const preparedQueries = React.useMemo(() => {
        const queries = savedHistoryQueries ?? [];

        return queries.map(getQueryInHistory);
    }, [savedHistoryQueries]);

    const filteredHistoryQueries = React.useMemo(() => {
        const normalizedFilter = queriesFilter?.toLowerCase();
        return normalizedFilter
            ? preparedQueries.filter((item) =>
                  item.queryText.toLowerCase().includes(normalizedFilter),
              )
            : preparedQueries;
    }, [preparedQueries, queriesFilter]);

    // These functions are used inside Monaco editorDidMount
    // They should be stable to work properly
    const goToPreviousQuery = useEventHandler(() => {
        if (preparedQueries.length === 0) {
            return;
        }

        let query: QueryInHistory | undefined;

        const currentIndex = preparedQueries.findIndex((q) => q.queryId === historyCurrentQueryId);

        if (currentIndex === -1) {
            // Query not found, start from last
            query = preparedQueries.at(-1);
        } else if (currentIndex === 0) {
            // At first query, wrap to last
            query = preparedQueries.at(-1);
        } else {
            // Go to previous query
            query = preparedQueries[currentIndex - 1];
        }

        if (query) {
            dispatch(changeUserInput({input: query.queryText}));
            dispatch(setHistoryCurrentQueryId(query.queryId));
        }
    });

    const goToNextQuery = useEventHandler(() => {
        if (preparedQueries.length === 0) {
            return;
        }

        let query: QueryInHistory | undefined;

        const currentIndex = preparedQueries.findIndex((q) => q.queryId === historyCurrentQueryId);

        if (currentIndex === -1) {
            // Query not found, start from last
            query = preparedQueries.at(-1);
        } else if (currentIndex === preparedQueries.length - 1) {
            // At last query, wrap to first
            query = preparedQueries[0];
        } else {
            // Go to next query
            query = preparedQueries[currentIndex + 1];
        }

        if (query) {
            dispatch(changeUserInput({input: query.queryText}));
            dispatch(setHistoryCurrentQueryId(query.queryId));
        }
    });

    const saveQueryToHistory = useEventHandler((queryText: string, queryId: string) => {
        if (!queryText) {
            return;
        }
        // +1 to include new query
        const sliceLimit = preparedQueries.length + 1 - MAXIMUM_QUERIES_IN_HISTORY;
        const slicedQueries = preparedQueries.slice(sliceLimit < 0 ? 0 : sliceLimit);
        const newQueries = [...slicedQueries, {queryText, queryId}];

        saveHistoryQueries(newQueries);

        // Update currentQueryId to point to the newly added query
        dispatch(setHistoryCurrentQueryId(queryId));
    });

    const updateQueryInHistory = useEventHandler((queryId: string, stats: QueryStats) => {
        if (!stats || !preparedQueries.length) {
            return;
        }

        const index = preparedQueries.findIndex((item) => item.queryId === queryId);

        if (index !== -1) {
            const newQueries = [...preparedQueries];
            const {durationUs, endTime} = stats;
            newQueries[index] = {
                ...preparedQueries[index],
                durationUs,
                endTime,
            };
            saveHistoryQueries(newQueries);
        }
    });

    return {
        historyQueries: preparedQueries,
        historyCurrentQueryId,
        filteredHistoryQueries,
        goToPreviousQuery,
        goToNextQuery,
        saveQueryToHistory,
        updateQueryInHistory,
    };
}
