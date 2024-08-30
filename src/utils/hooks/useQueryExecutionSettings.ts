import {useTracingLevelOptionAvailable} from '../../store/reducers/capabilities/hooks';
import type {QuerySettings} from '../../types/store/query';
import {DEFAULT_QUERY_SETTINGS, QUERY_EXECUTION_SETTINGS_KEY} from '../constants';

import {useSetting} from './useSetting';

export const useQueryExecutionSettings = () => {
    const enableTracingLevel = useTracingLevelOptionAvailable();
    const [setting, setSetting] = useSetting<QuerySettings>(QUERY_EXECUTION_SETTINGS_KEY);

    // deprecated https://github.com/ydb-platform/ydb-embedded-ui/issues/1239
    delete setting['isolationLevel'];

    return [
        {
            ...setting,
            transactionMode: setting.transactionMode ?? DEFAULT_QUERY_SETTINGS.transactionMode,
            tracingLevel: enableTracingLevel
                ? setting.tracingLevel
                : DEFAULT_QUERY_SETTINGS.tracingLevel,
        },
        setSetting,
    ] as const;
};
