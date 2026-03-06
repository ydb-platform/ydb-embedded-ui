import React from 'react';

import {selectSavedQueriesFilter} from '../../../../store/reducers/queryActions/queryActions';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import type {SavedQuery} from '../../../../types/store/query';
import {useSetting, useTypedSelector} from '../../../../utils/hooks';

export function useSavedQueries() {
    const [savedQueries, saveQueries] = useSetting<SavedQuery[]>(SETTING_KEYS.SAVED_QUERIES);

    const filter = useTypedSelector(selectSavedQueriesFilter).trim().toLowerCase();

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
        (queryName: string | null, queryBody: string) => {
            if (!queryName) {
                return;
            }

            const currentQueries = savedQueries ?? [];
            const nextSavedQueries = [...currentQueries];

            const queryIndex = currentQueries.findIndex((el) => findQueryByName(el, queryName));

            if (queryIndex >= 0) {
                nextSavedQueries[queryIndex] = {
                    ...currentQueries[queryIndex],
                    body: queryBody,
                };
            } else {
                nextSavedQueries.push({name: queryName, body: queryBody});
            }

            saveQueries(nextSavedQueries);
        },
        [savedQueries, saveQueries],
    );

    return {savedQueries, filteredSavedQueries, deleteSavedQuery, saveQuery};
}

function findQueryByName(query: SavedQuery, name: string) {
    return query.name.toLowerCase() === name.toLowerCase();
}
