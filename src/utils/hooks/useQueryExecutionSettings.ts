import type {QuerySettings} from '../../types/store/query';
import {
    DEFAULT_QUERY_SETTINGS,
    ENABLE_TRACING_LEVEL_KEY,
    QUERY_EXECUTION_SETTINGS_KEY,
} from '../constants';

import {useSetting} from './useSetting';

export const useQueryExecutionSettings = () => {
    const [enableTracingLevel] = useSetting<boolean>(ENABLE_TRACING_LEVEL_KEY);
    const [setting, setSetting] = useSetting<QuerySettings>(QUERY_EXECUTION_SETTINGS_KEY);

    return [
        {
            ...setting,
            tracingLevel: enableTracingLevel
                ? setting.tracingLevel
                : DEFAULT_QUERY_SETTINGS.tracingLevel,
        },
        setSetting,
    ] as const;
};
