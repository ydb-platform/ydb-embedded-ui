import type {QuerySettings} from '../../types/store/query';
import {
    DEFAULT_QUERY_SETTINGS,
    QUERY_EXECUTION_SETTINGS_KEY,
    TRACING_LEVEL_VERBOSITY_KEY,
} from '../constants';

import {useSetting} from './useSetting';

export const useQueryExecutionSettings = () => {
    const [tracingLevelVerbosity] = useSetting<boolean>(TRACING_LEVEL_VERBOSITY_KEY);
    const [setting, setSetting] = useSetting<QuerySettings>(QUERY_EXECUTION_SETTINGS_KEY);

    return [
        {
            ...setting,
            tracingLevel: tracingLevelVerbosity
                ? setting.tracingLevel
                : DEFAULT_QUERY_SETTINGS.tracingLevel,
        },
        setSetting,
    ] as const;
};
