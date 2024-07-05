import {SAVED_QUERIES_KEY, useSetting} from '../../../../lib';
import type {SavedQuery} from '../../../../types/store/query';

export function useSavedQueries() {
    const [savedQueries] = useSetting<SavedQuery[]>(SAVED_QUERIES_KEY, []);

    return savedQueries;
}
