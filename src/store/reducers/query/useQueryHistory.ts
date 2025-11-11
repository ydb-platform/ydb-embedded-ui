import React from 'react';

import {useTypedDispatch} from '../../../utils/hooks/useTypedDispatch';
import {useTypedSelector} from '../../../utils/hooks/useTypedSelector';
import {SETTING_KEYS} from '../settings/constants';
import {useSetting} from '../settings/useSetting';

import {
    changeUserInput,
    selectQueriesHistoryCurrentIndex,
    selectQueriesHistoryFilter,
    setCurrentIndex,
} from './query';
import type {QueryInHistory} from './types';
import {getQueryInHistory} from './utils';

const MAXIMUM_QUERIES_IN_HISTORY = 20;

interface QueryStats {
    durationUs?: string | number;
    endTime?: string | number;
}

export function useQueryHistory() {
    const dispatch = useTypedDispatch();
    const currentIndex = useTypedSelector(selectQueriesHistoryCurrentIndex);
    const queriesFilter = useTypedSelector(selectQueriesHistoryFilter);

    const {
        value: queriesHistory,
        saveValue: saveQueriesHistory,
        isLoading,
    } = useSetting<QueryInHistory[]>(SETTING_KEYS.QUERIES_HISTORY);

    const [queries, setQueries] = React.useState<QueryInHistory[]>([]);

    React.useEffect(() => {
        if (!queriesHistory || queriesHistory.length === 0) {
            setQueries([]);
            return;
        }
        setQueries(queriesHistory.map(getQueryInHistory));
    }, [queriesHistory]);

    const filteredQueries = React.useMemo(() => {
        const normalizedFilter = queriesFilter?.toLowerCase();
        return normalizedFilter
            ? queries.filter((item) => item.queryText.toLowerCase().includes(normalizedFilter))
            : queries;
    }, [queries, queriesFilter]);

    const saveQueryToHistory = React.useCallback(
        (queryText: string, queryId: string) => {
            const newQueries = [...queries, {queryText, queryId}].slice(
                queries.length >= MAXIMUM_QUERIES_IN_HISTORY ? 1 : 0,
            );
            saveQueriesHistory(newQueries);
            // Update currentIndex to point to the newly added query
            const newCurrentIndex = newQueries.length - 1;
            dispatch(setCurrentIndex(newCurrentIndex));
        },
        [queries, saveQueriesHistory, dispatch],
    );

    const updateQueryInHistory = React.useCallback(
        (queryId: string, stats: QueryStats) => {
            setQueries((currentQueries) => {
                if (stats && currentQueries.length !== 0) {
                    const index = currentQueries.findIndex((item) => item.queryId === queryId);

                    if (index !== -1) {
                        const newQueries = [...currentQueries];
                        const {durationUs, endTime} = stats;
                        newQueries.splice(index, 1, {
                            ...currentQueries[index],
                            durationUs,
                            endTime,
                        });
                        saveQueriesHistory(newQueries);
                    }
                }

                // Update only in useEffect
                return currentQueries;
            });
        },
        [saveQueriesHistory],
    );

    const goToPreviousQuery = React.useCallback(() => {
        if (queries.length === 0 || currentIndex === undefined || currentIndex <= 0) {
            return;
        }
        const newCurrentIndex = currentIndex - 1;
        const query = queries[newCurrentIndex];
        if (query) {
            dispatch(changeUserInput({input: query.queryText}));
            dispatch(setCurrentIndex(newCurrentIndex));
        }
    }, [queries, currentIndex, dispatch]);

    const goToNextQuery = React.useCallback(() => {
        if (
            queries.length === 0 ||
            currentIndex === undefined ||
            currentIndex >= queries.length - 1
        ) {
            return;
        }
        const newCurrentIndex = currentIndex + 1;
        const query = queries[newCurrentIndex];
        if (query) {
            dispatch(changeUserInput({input: query.queryText}));
            dispatch(setCurrentIndex(newCurrentIndex));
        }
    }, [queries, currentIndex, dispatch]);

    return {
        queries,
        filteredQueries,
        currentIndex,
        saveQueryToHistory,
        updateQueryInHistory,
        goToPreviousQuery,
        goToNextQuery,
        isLoading,
    };
}
