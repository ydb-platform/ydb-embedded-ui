import type {QuerySettings} from '../../types/store/query';
import {LAST_QUERY_EXECUTION_SETTINGS_KEY} from '../constants';
import {querySettingsValidationSchema} from '../query';

import {useSetting} from './useSetting';

export const useLastQueryExecutionSettings = () => {
    const [lastStorageSettings, setLastSettings] = useSetting<QuerySettings | undefined>(
        LAST_QUERY_EXECUTION_SETTINGS_KEY,
    );

    const lastSettings: QuerySettings | undefined = lastStorageSettings
        ? querySettingsValidationSchema.parse(lastStorageSettings)
        : undefined;

    return [lastSettings, setLastSettings] as const;
};
