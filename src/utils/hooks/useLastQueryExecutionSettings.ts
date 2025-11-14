import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import type {QuerySettings} from '../../types/store/query';
import {querySettingsValidationSchema} from '../query';

import {useSetting} from './useSetting';

export const useLastQueryExecutionSettings = () => {
    const [lastStorageSettings, setLastSettings] = useSetting<QuerySettings | undefined>(
        SETTING_KEYS.LAST_QUERY_EXECUTION_SETTINGS,
    );
    let lastSettings: QuerySettings | undefined;

    try {
        lastSettings = querySettingsValidationSchema.parse(lastStorageSettings);
    } catch {
        lastSettings = undefined;
    }

    return [lastSettings, setLastSettings] as const;
};
