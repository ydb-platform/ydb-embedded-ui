import React from 'react';

import {selectSavedQueriesFilter} from '../../../../store/reducers/queryActions/queryActions';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import {useSetting} from '../../../../store/reducers/settings/useSetting';
import type {SavedQuery} from '../../../../types/store/query';
import {useTypedSelector} from '../../../../utils/hooks';

export function useSavedQueries() {
    const {
        value: savedQueries,
        saveValue: saveQueries,
        isLoading,
    } = useSetting<SavedQuery[]>(SETTING_KEYS.SAVED_QUERIES);

    const filter = useTypedSelector(selectSavedQueriesFilter).trim().toLowerCase();
    const currentInput = useTypedSelector((state) => state.query.input);

    const filteredSavedQueries = React.useMemo(() => {
        const queries = savedQueries ?? [];

        if (filter) {
            return queries.filter((item) => item.body.toLowerCase().includes(filter));
        }
        return queries;
    }, [savedQueries, filter]);

    const deleteSavedQuery = React.useCallback(
        (queryName: string) => {
            const queries = savedQueries ?? [];
            const nextSavedQueries = queries.filter((el) => !findQueryByName(el, queryName));

            saveQueries(nextSavedQueries);
        },
        [savedQueries, saveQueries],
    );

    const saveQuery = React.useCallback(
        (queryName: string | null) => {
            if (!queryName) {
                return;
            }

            const currentQueries = savedQueries ?? [];
            const nextSavedQueries = [...currentQueries];

            const queryIndex = currentQueries.findIndex((el) => findQueryByName(el, queryName));

            if (queryIndex >= 0) {
                nextSavedQueries[queryIndex] = {
                    ...currentQueries[queryIndex],
                    body: currentInput,
                };
            } else {
                nextSavedQueries.push({name: queryName, body: currentInput});
            }

            saveQueries(nextSavedQueries);
        },
        [savedQueries, saveQueries, currentInput],
    );

    return {savedQueries, filteredSavedQueries, deleteSavedQuery, saveQuery, isLoading};
}

function findQueryByName(query: SavedQuery, name: string) {
    return query.name.toLowerCase() === name.toLowerCase();
}
