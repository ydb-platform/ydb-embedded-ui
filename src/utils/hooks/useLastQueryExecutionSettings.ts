import type {QuerySettings} from '../../types/store/query';
import {LAST_QUERY_EXECUTION_SETTINGS_KEY} from '../constants';
import {querySettingsValidationSchema} from '../query';

import {useSetting} from './useSetting';

export const useLastQueryExecutionSettings = () => {
    const [lastStorageSettings, setLastSettings] = useSetting<QuerySettings | undefined>(
        LAST_QUERY_EXECUTION_SETTINGS_KEY,
    );
    let lastSettings: QuerySettings | undefined;

    try {
        lastSettings = querySettingsValidationSchema.parse(lastStorageSettings);
    } catch (error) {
        lastSettings = undefined;
    }

    return [lastSettings, setLastSettings] as const;
};
