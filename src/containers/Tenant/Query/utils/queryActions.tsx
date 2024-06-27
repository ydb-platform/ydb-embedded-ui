import React from 'react';

import {SAVED_QUERIES_KEY, useSetting, useTypedSelector} from '../../../../lib';
import type {SavedQuery} from '../../../../types/store/query';

export function useSavedQueries() {
    const [savedQueries] = useSetting<SavedQuery[]>(SAVED_QUERIES_KEY, []);

    return savedQueries;
}

export function useSaveQuery() {
    const [savedQueries, setSavedQueries] = useSetting<SavedQuery[]>(SAVED_QUERIES_KEY, []);

    const queryBody = useTypedSelector((state) => state.executeQuery.input);

    const handleSaveQuery = React.useCallback(
        (queryName: string | null) => {
            if (queryName === null) {
                return;
            }
            const nextSavedQueries = [...savedQueries];

            const query = nextSavedQueries.find(
                (el) => el.name.toLowerCase() === queryName.toLowerCase(),
            );

            if (query) {
                query.body = queryBody;
            } else {
                nextSavedQueries.push({name: queryName, body: queryBody});
            }

            setSavedQueries(nextSavedQueries);
        },
        [savedQueries, setSavedQueries, queryBody],
    );

    return handleSaveQuery;
}

export function useDeleteSavedQuery() {
    const [savedQueries, setSavedQueries] = useSetting<SavedQuery[]>(SAVED_QUERIES_KEY, []);

    const handleDeleteQuery = React.useCallback(
        (queryName: string) => {
            const newSavedQueries = savedQueries.filter(
                (el) => el.name.toLowerCase() !== queryName.toLowerCase(),
            );
            setSavedQueries(newSavedQueries);
        },
        [savedQueries, setSavedQueries],
    );

    return handleDeleteQuery;
}
