import type {QuerySettings} from '../../types/store/query';
import {LAST_QUERY_EXECUTION_SETTINGS_KEY} from '../constants';

import {useSetting} from './useSetting';

export const useLastQueryExecutionSettings = () => {
    return useSetting<QuerySettings | undefined>(LAST_QUERY_EXECUTION_SETTINGS_KEY);
};
