import {useTracingLevelOptionAvailable} from '../../store/reducers/capabilities/hooks';
import type {QuerySettings} from '../../types/store/query';
import {DEFAULT_QUERY_SETTINGS, QUERY_EXECUTION_SETTINGS_KEY} from '../constants';

import {useSetting} from './useSetting';

export const useQueryExecutionSettings = () => {
    const enableTracingLevel = useTracingLevelOptionAvailable();
    const [storageSettings, setSettings] = useSetting<QuerySettings>(QUERY_EXECUTION_SETTINGS_KEY);

    const settings: QuerySettings = {
        queryMode: storageSettings.queryMode ?? DEFAULT_QUERY_SETTINGS.queryMode,
        timeout: storageSettings.timeout ?? DEFAULT_QUERY_SETTINGS.timeout,
        statisticsMode: storageSettings.statisticsMode ?? DEFAULT_QUERY_SETTINGS.statisticsMode,
        transactionMode: storageSettings.transactionMode ?? DEFAULT_QUERY_SETTINGS.transactionMode,
        tracingLevel: enableTracingLevel
            ? storageSettings.tracingLevel
            : DEFAULT_QUERY_SETTINGS.tracingLevel,
    };

    return [settings, setSettings] as const;
};
