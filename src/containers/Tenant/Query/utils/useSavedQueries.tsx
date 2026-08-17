import React from 'react';

import {renameSavedQueryTabs} from '../../../../store/reducers/query/query';
import {selectSavedQueriesFilter} from '../../../../store/reducers/queryActions/queryActions';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import type {SavedQuery} from '../../../../types/store/query';
import {useSetting, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {sortByTimestampDescending} from '../../../../utils/sortByTimestamp';

import {filterSavedQueries, renameSavedQueryInList, upsertSavedQuery} from './savedQueries';

export function useSavedQueries() {
    const [savedQueries, saveQueries] = useSetting<SavedQuery[]>(SETTING_KEYS.SAVED_QUERIES);

    const dispatch = useTypedDispatch();
    const filter = useTypedSelector(selectSavedQueriesFilter);

    const filteredSavedQueries = React.useMemo(() => {
        const filteredQueries = filterSavedQueries(savedQueries ?? [], filter);
        return sortByTimestampDescending(filteredQueries, (query) => query.updatedAt);
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

            saveQueries(upsertSavedQuery(savedQueries ?? [], queryName, queryBody, Date.now()));
        },
        [savedQueries, saveQueries],
    );

    const renameSavedQuery = React.useCallback(
        (previousName: string, nextName: string) => {
            const result = renameSavedQueryInList(
                savedQueries ?? [],
                previousName,
                nextName,
                Date.now(),
            );
            if (result.renamed) {
                saveQueries(result.queries);
                dispatch(renameSavedQueryTabs({previousName, nextName}));
            }
            return result.renamed;
        },
        [dispatch, savedQueries, saveQueries],
    );

    return {savedQueries, filteredSavedQueries, deleteSavedQuery, saveQuery, renameSavedQuery};
}

function findQueryByName(query: SavedQuery, name: string) {
    return query.name.toLowerCase() === name.toLowerCase();
}
