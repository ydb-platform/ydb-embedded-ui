import React from 'react';

import {
    detachSavedQueryTabs,
    renameSavedQueryTabs,
    syncSavedQueryTabsAfterUpdate,
} from '../../../../store/reducers/query/query';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import type {SettingSaveTarget} from '../../../../store/reducers/settings/types';
import {useSetting} from '../../../../store/reducers/settings/useSetting';
import type {SavedQuery} from '../../../../types/store/query';
import {useTypedDispatch} from '../../../../utils/hooks';
import i18n from '../i18n';

import type {RenameSavedQueryStatus} from './savedQueries';
import {getSavedQueriesSizeError, renameSavedQueryInList, upsertSavedQuery} from './savedQueries';
import {showQuerySettingsWarning} from './showQuerySettingsWarning';

export type RenameSavedQueryResult = RenameSavedQueryStatus | 'save-failed';

type UpdateSavedQueryResult = 'updated' | 'duplicate' | 'not-found' | 'save-failed';

function notifySavedQueriesSaveError(target: SettingSaveTarget) {
    showQuerySettingsWarning(
        i18n(
            target === 'local'
                ? 'alert_query-settings-local-save-error'
                : 'alert_saved-queries-sync-error',
        ),
    );
}

export function useSavedQueries() {
    const {value: savedQueries, saveValue: saveQueries} = useSetting<SavedQuery[]>(
        SETTING_KEYS.SAVED_QUERIES,
        notifySavedQueriesSaveError,
    );

    const dispatch = useTypedDispatch();

    const trySaveQueries = React.useCallback(
        (queries: SavedQuery[], changedQueryName: string) => {
            const error = getSavedQueriesSizeError(queries, changedQueryName);
            if (error) {
                showQuerySettingsWarning(
                    i18n(
                        error === 'query-too-large'
                            ? 'alert_saved-query-too-large'
                            : 'alert_saved-queries-list-full',
                    ),
                );
                return false;
            }

            return saveQueries(queries);
        },
        [saveQueries],
    );

    const deleteSavedQuery = React.useCallback(
        (queryName: string) => {
            const queries = savedQueries ?? [];
            const nextSavedQueries = queries.filter((el) => !findQueryByName(el, queryName));

            if (saveQueries(nextSavedQueries)) {
                dispatch(detachSavedQueryTabs({savedQueryName: queryName}));
            }
        },
        [dispatch, savedQueries, saveQueries],
    );

    const saveQuery = React.useCallback(
        (queryName: string | null, queryBody: string) => {
            if (!queryName) {
                return false;
            }

            const queries = upsertSavedQuery(savedQueries ?? [], queryName, queryBody, Date.now());
            return trySaveQueries(queries, queryName);
        },
        [savedQueries, trySaveQueries],
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
            if (!trySaveQueries(result.queries, nextName)) {
                return 'save-failed';
            }

            dispatch(renameSavedQueryTabs({previousName, nextName}));
            return 'renamed';
        },
        [dispatch, savedQueries, trySaveQueries],
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
            if (!trySaveQueries(nextQueries, nameToSave)) {
                return 'save-failed';
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
        [dispatch, savedQueries, trySaveQueries],
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
