import {SAVED_QUERIES_KEY, useSetting} from '../../../../lib';
import type {SavedQuery} from '../../../../types/store/query';

export function useSavedQueries(filter?: string) {
    const [savedQueries] = useSetting<SavedQuery[]>(SAVED_QUERIES_KEY, []);

    return filter ? savedQueries.filter((item) => item.body.includes(filter)) : savedQueries;
}
