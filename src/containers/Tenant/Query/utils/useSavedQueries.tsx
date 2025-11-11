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
    const filter = useTypedSelector(selectSavedQueriesFilter).toLowerCase();
    const currentInput = useTypedSelector((state) => state.query.input);

    const filteredQueries = React.useMemo(() => {
        const queries = savedQueries ?? [];

        if (filter) {
            return queries.filter((item) => item.body.toLowerCase().includes(filter));
        }
        return queries;
    }, [filter, savedQueries]);

    const deleteSavedQuery = React.useCallback(
        (queryName: string) => {
            const nextSavedQueries = savedQueries?.filter(
                (el) => el.name.toLowerCase() !== queryName.toLowerCase(),
            );

            saveQueries(nextSavedQueries);
        },
        [savedQueries, saveQueries],
    );

    const saveNewQuery = React.useCallback(
        (queryName: string | null) => {
            if (queryName === null) {
                return;
            }

            let nextSavedQueries: SavedQuery[] = [];

            if (savedQueries) {
                nextSavedQueries = [...savedQueries];
            }

            const query = nextSavedQueries.find(
                (el) => el.name.toLowerCase() === queryName.toLowerCase(),
            );

            if (query) {
                query.body = currentInput;
            } else {
                nextSavedQueries.push({name: queryName, body: currentInput});
            }

            saveQueries(nextSavedQueries);
        },
        [savedQueries, saveQueries, currentInput],
    );

    return {savedQueries, filteredQueries, saveNewQuery, deleteSavedQuery, isLoading} as const;
}
