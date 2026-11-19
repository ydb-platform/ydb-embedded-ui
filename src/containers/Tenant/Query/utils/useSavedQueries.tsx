import React from 'react';

import {
    detachSavedQueryTabs,
    renameSavedQueryTabs,
    syncSavedQueryTabsAfterUpdate,
} from '../../../../store/reducers/query/query';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import {useSetting} from '../../../../store/reducers/settings/useSetting';
import type {SavedQuery} from '../../../../types/store/query';
import createToast from '../../../../utils/createToast';
import {useTypedDispatch} from '../../../../utils/hooks';
import i18n from '../i18n';

import type {RenameSavedQueryStatus} from './savedQueries';
import {getSavedQueriesSizeError, renameSavedQueryInList, upsertSavedQuery} from './savedQueries';

export type RenameSavedQueryResult = RenameSavedQueryStatus | 'size-limit';

type UpdateSavedQueryResult = 'updated' | 'duplicate' | 'not-found' | 'size-limit';

function notifySavedQueriesSyncError() {
    createToast({
        name: 'saved-queries-sync-error',
        title: i18n('alert_saved-queries-sync-error'),
        theme: 'warning',
    });
}

export function useSavedQueries() {
    const {value: savedQueries, saveValue: saveQueries} = useSetting<SavedQuery[]>(
        SETTING_KEYS.SAVED_QUERIES,
        notifySavedQueriesSyncError,
    );

    const dispatch = useTypedDispatch();

    const saveQueriesWithinLimit = React.useCallback(
        (queries: SavedQuery[], changedQueryName: string) => {
            const error = getSavedQueriesSizeError(queries, changedQueryName);
            if (error) {
                createToast({
                    name: 'saved-queries-size-limit',
                    title: i18n(
                        error === 'query-too-large'
                            ? 'alert_saved-query-too-large'
                            : 'alert_saved-queries-list-full',
                    ),
                    theme: 'warning',
                });
                return false;
            }

            saveQueries(queries);
            return true;
        },
        [saveQueries],
    );

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
                return false;
            }

            const queries = upsertSavedQuery(savedQueries ?? [], queryName, queryBody, Date.now());
            return saveQueriesWithinLimit(queries, queryName);
        },
        [savedQueries, saveQueriesWithinLimit],
    );

    const renameSavedQuery = React.useCallback(
        (previousName: string, nextName: string): RenameSavedQueryResult => {
            const result = renameSavedQueryInList(
                savedQueries ?? [],
                previousName,
                nextName,
                Date.now(),
            );
            if (result.status !== 'renamed') {
                return result.status;
            }
            if (!saveQueriesWithinLimit(result.queries, nextName)) {
                return 'size-limit';
            }

            dispatch(renameSavedQueryTabs({previousName, nextName}));
            return 'renamed';
        },
        [dispatch, savedQueries, saveQueriesWithinLimit],
    );

    const updateSavedQuery = React.useCallback(
        (
            previousName: string,
            nextName: string,
            queryBody: string,
            sourceTabId: string,
        ): UpdateSavedQueryResult => {
            const nameToSave = nextName === previousName ? previousName : nextName.trim();
            const queries = savedQueries ?? [];

            const updatedAt = Date.now();
            const renameResult = renameSavedQueryInList(
                queries,
                previousName,
                nameToSave,
                updatedAt,
            );
            if (renameResult.status !== 'renamed') {
                return renameResult.status;
            }

            const previousQuery = renameResult.queries.find((query) => query.name === nameToSave);
            if (!previousQuery) {
                return 'not-found';
            }

            const nextQueries = upsertSavedQuery(
                renameResult.queries,
                nameToSave,
                queryBody,
                updatedAt,
            );
            if (!saveQueriesWithinLimit(nextQueries, nameToSave)) {
                return 'size-limit';
            }
            dispatch(
                syncSavedQueryTabsAfterUpdate({
                    sourceTabId,
                    previousName,
                    nextName: nameToSave,
                    previousBody: previousQuery.body,
                    nextBody: queryBody,
                }),
            );

            return 'updated';
        },
        [dispatch, savedQueries, saveQueriesWithinLimit],
    );

    return {
        savedQueries,
        deleteSavedQuery,
        saveQuery,
        renameSavedQuery,
        updateSavedQuery,
    };
}

function findQueryByName(query: SavedQuery, name: string) {
    return query.name.toLowerCase() === name.toLowerCase();
}
