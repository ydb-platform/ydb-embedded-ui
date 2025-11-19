import React from 'react';

import {
    useEventHandler,
    useSetting,
    useTypedDispatch,
    useTypedSelector,
} from '../../../utils/hooks';
import {SETTING_KEYS} from '../settings/constants';

import {changeUserInput, selectQueriesHistoryFilter} from './query';
import type {QueryInHistory, QueryStats} from './types';
import {getQueryInHistory} from './utils';

const MAXIMUM_QUERIES_IN_HISTORY = 20;

export function useQueriesHistory() {
    const dispatch = useTypedDispatch();
    const queriesFilter = useTypedSelector(selectQueriesHistoryFilter);

    const [savedHistoryQueries, saveHistoryQueries] = useSetting<QueryInHistory[]>(
        SETTING_KEYS.QUERIES_HISTORY,
    );

    const [historyQueries, setQueries] = React.useState<QueryInHistory[]>([]);
    const [historyCurrentIndex, setCurrentIndex] = React.useState(-1);

    React.useEffect(() => {
        if (!savedHistoryQueries || savedHistoryQueries.length === 0) {
            setQueries([]);
            setCurrentIndex(-1);
        } else {
            const sliceLimit = savedHistoryQueries.length - MAXIMUM_QUERIES_IN_HISTORY;

            const preparedQueries = savedHistoryQueries
                .slice(sliceLimit < 0 ? 0 : sliceLimit)
                .map(getQueryInHistory);

            setQueries(preparedQueries);
            setCurrentIndex(preparedQueries.length - 1);
        }
    }, [savedHistoryQueries]);

    const filteredHistoryQueries = React.useMemo(() => {
        const normalizedFilter = queriesFilter?.toLowerCase();
        return normalizedFilter
            ? historyQueries.filter((item) =>
                  item.queryText.toLowerCase().includes(normalizedFilter),
              )
            : historyQueries;
    }, [historyQueries, queriesFilter]);

    // These functions are used inside Monaco editorDidMount
    // They should be stable to work properly
    const goToPreviousQuery = useEventHandler(() => {
        setCurrentIndex((index) => {
            if (historyQueries.length > 0 && index > 0) {
                const newIndex = index - 1;
                const query = historyQueries[newIndex];

                if (query) {
                    dispatch(changeUserInput({input: query.queryText}));
                    return newIndex;
                }
            }
            return index;
        });
    });

    const goToNextQuery = useEventHandler(() => {
        setCurrentIndex((index) => {
            if (historyQueries.length > 0 && index < historyQueries.length - 1) {
                const newIndex = index + 1;
                const query = historyQueries[newIndex];
                if (query) {
                    dispatch(changeUserInput({input: query.queryText}));
                    return newIndex;
                }
            }

            return index;
        });
    });

    const saveQueryToHistory = useEventHandler((queryText: string, queryId: string) => {
        setQueries((currentQueries) => {
            const newQueries = [...currentQueries, {queryText, queryId}].slice(
                historyQueries.length >= MAXIMUM_QUERIES_IN_HISTORY ? 1 : 0,
            );
            saveHistoryQueries(newQueries);

            // Update currentIndex to point to the newly added query
            const newCurrentIndex = newQueries.length - 1;
            setCurrentIndex(newCurrentIndex);

            return newQueries;
        });
    });

    const updateQueryInHistory = useEventHandler((queryId: string, stats: QueryStats) => {
        if (!stats) {
            return;
        }

        setQueries((currentQueries) => {
            if (!currentQueries.length) {
                return currentQueries;
            }

            const index = currentQueries.findIndex((item) => item.queryId === queryId);

            if (index !== -1) {
                const newQueries = [...currentQueries];
                const {durationUs, endTime} = stats;
                newQueries.splice(index, 1, {
                    ...currentQueries[index],
                    durationUs,
                    endTime,
                });
                saveHistoryQueries(newQueries);
                return newQueries;
            }
            return currentQueries;
        });
    });

    return {
        historyQueries,
        historyCurrentIndex,
        filteredHistoryQueries,
        goToPreviousQuery,
        goToNextQuery,
        saveQueryToHistory,
        updateQueryInHistory,
    };
}
