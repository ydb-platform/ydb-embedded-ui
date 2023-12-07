import type {QueryMode} from '../../types/store/query';
import {QUERY_INITIAL_MODE_KEY} from '../constants';
import {useSetting} from './useSetting';

export const useQueryModes = () => {
    return useSetting<QueryMode>(QUERY_INITIAL_MODE_KEY);
};
