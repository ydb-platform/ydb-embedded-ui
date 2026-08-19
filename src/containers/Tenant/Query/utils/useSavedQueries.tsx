import React from 'react';

import {detachSavedQueryTabs, renameSavedQueryTabs} from '../../../../store/reducers/query/query';
import {selectSavedQueriesFilter} from '../../../../store/reducers/queryActions/queryActions';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import type {SavedQuery} from '../../../../types/store/query';
import {useSetting, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {sortByTimestampDescending} from '../../../../utils/sortByTimestamp';

import {
    filterSavedQueries,
    hasSavedQueryNameCollision,
    renameSavedQueryInList,
    upsertSavedQuery,
} from './savedQueries';

type UpdateSavedQueryResult = 'updated' | 'duplicate' | 'not-found';

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
            dispatch(detachSavedQueryTabs({savedQueryName: queryName}));
        },
        [dispatch, savedQueries, saveQueries],
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

    const updateSavedQuery = React.useCallback(
        (previousName: string, nextName: string, queryBody: string): UpdateSavedQueryResult => {
            const nameToSave = nextName === previousName ? previousName : nextName.trim();
            const queries = savedQueries ?? [];

            if (hasSavedQueryNameCollision(queries, previousName, nameToSave)) {
                return 'duplicate';
            }

            const updatedAt = Date.now();
            const renameResult = renameSavedQueryInList(
                queries,
                previousName,
                nameToSave,
                updatedAt,
            );
            if (!renameResult.renamed) {
                return 'not-found';
            }

            saveQueries(upsertSavedQuery(renameResult.queries, nameToSave, queryBody, updatedAt));
            dispatch(renameSavedQueryTabs({previousName, nextName: nameToSave}));

            return 'updated';
        },
        [dispatch, savedQueries, saveQueries],
    );

    return {
        savedQueries,
        filteredSavedQueries,
        deleteSavedQuery,
        saveQuery,
        renameSavedQuery,
        updateSavedQuery,
    };
}

function findQueryByName(query: SavedQuery, name: string) {
    return query.name.toLowerCase() === name.toLowerCase();
}
