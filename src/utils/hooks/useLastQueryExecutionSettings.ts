import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {useSetting} from '../../store/reducers/settings/useSetting';
import type {QuerySettings} from '../../types/store/query';
import {querySettingsValidationSchema} from '../query';

export const useLastQueryExecutionSettings = () => {
    const {value: lastStorageSettings, saveValue: setLastSettings} = useSetting<
        QuerySettings | undefined
    >(SETTING_KEYS.LAST_QUERY_EXECUTION_SETTINGS);
    let lastSettings: QuerySettings | undefined;

    try {
        lastSettings = querySettingsValidationSchema.parse(lastStorageSettings);
    } catch {
        lastSettings = undefined;
    }

    return [lastSettings, setLastSettings] as const;
};
