import {useTracingLevelOptionAvailable} from '../../store/reducers/capabilities/hooks';
import type {QuerySettings} from '../../types/store/query';
import {QUERY_EXECUTION_SETTINGS_KEY} from '../constants';
import {DEFAULT_QUERY_SETTINGS, querySettingsValidationSchema} from '../query';

import {useSetting} from './useSetting';

export const useQueryExecutionSettings = () => {
    const enableTracingLevel = useTracingLevelOptionAvailable();
    const [storageSettings, setSettings] = useSetting<QuerySettings>(QUERY_EXECUTION_SETTINGS_KEY);

    const validatedSettings = querySettingsValidationSchema.parse(storageSettings);

    const settings: QuerySettings = {
        ...validatedSettings,
        tracingLevel: enableTracingLevel
            ? validatedSettings.tracingLevel
            : DEFAULT_QUERY_SETTINGS.tracingLevel,
    };

    return [settings, setSettings] as const;
};
