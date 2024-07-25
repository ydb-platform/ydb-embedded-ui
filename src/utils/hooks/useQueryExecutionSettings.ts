import type {QuerySettings} from '../../types/store/query';
import {QUERY_EXECUTION_SETTINGS_KEY} from '../constants';

import {useSetting} from './useSetting';

export const useQueryExecutionSettings = () => {
    return useSetting<QuerySettings>(QUERY_EXECUTION_SETTINGS_KEY);
};
