import React from 'react';

import {selectSavedQueriesFilter} from '../../../../store/reducers/queryActions/queryActions';
import type {SavedQuery} from '../../../../types/store/query';
import {SAVED_QUERIES_KEY} from '../../../../utils/constants';
import {useSetting, useTypedSelector} from '../../../../utils/hooks';

export function useSavedQueries() {
    const [savedQueries] = useSetting<SavedQuery[]>(SAVED_QUERIES_KEY, []);
    const filter = useTypedSelector(selectSavedQueriesFilter).toLowerCase();

    const filteredSavedQueries = React.useMemo(() => {
        return savedQueries.filter((item) => item.body.toLowerCase().includes(filter));
    }, [savedQueries, filter]);

    return filter ? filteredSavedQueries : savedQueries;
}
