import React from 'react';

import {selectSavedQueriesFilter} from '../../../../store/reducers/queryActions/queryActions';
import {SETTING_KEYS} from '../../../../store/reducers/settings/constants';
import type {SavedQuery} from '../../../../types/store/query';
import {useSetting, useTypedSelector} from '../../../../utils/hooks';

export function useSavedQueries() {
    const [savedQueries] = useSetting<SavedQuery[]>(SETTING_KEYS.SAVED_QUERIES, []);

    return savedQueries;
}

export function useFilteredSavedQueries() {
    const savedQueries = useSavedQueries();
    const filter = useTypedSelector(selectSavedQueriesFilter).trim().toLowerCase();

    const filteredSavedQueries = React.useMemo(() => {
        if (filter.length === 0) {
            return savedQueries;
        }
        return savedQueries.filter((item) => item.body.toLowerCase().includes(filter));
    }, [savedQueries, filter]);

    return filteredSavedQueries;
}
