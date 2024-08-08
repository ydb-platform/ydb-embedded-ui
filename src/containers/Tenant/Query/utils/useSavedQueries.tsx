import {SAVED_QUERIES_KEY, useSetting, useTypedSelector} from '../../../../lib';
import {selectSavedQueriesFilter} from '../../../../store/reducers/queryActions/queryActions';
import type {SavedQuery} from '../../../../types/store/query';

export function useSavedQueries() {
    const [savedQueries] = useSetting<SavedQuery[]>(SAVED_QUERIES_KEY, []);
    const filter = useTypedSelector(selectSavedQueriesFilter).toLowerCase();

    return filter
        ? savedQueries.filter((item) => item.body.toLowerCase().includes(filter))
        : savedQueries;
}
