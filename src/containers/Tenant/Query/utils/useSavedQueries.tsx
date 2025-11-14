import React from 'react';

import {selectSavedQueriesFilter} from '../../../../store/reducers/queryActions/queryActions';
import type {SavedQuery} from '../../../../types/store/query';
import {SAVED_QUERIES_KEY} from '../../../../utils/constants';
import {useSetting, useTypedSelector} from '../../../../utils/hooks';

export function useSavedQueries() {
    const [savedQueries] = useSetting<SavedQuery[]>(SAVED_QUERIES_KEY, []);

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
