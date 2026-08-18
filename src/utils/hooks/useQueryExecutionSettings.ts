import {
    useSnapshotReadWriteAvailable,
    useTracingLevelOptionAvailable,
} from '../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import type {QuerySettings} from '../../types/store/query';
import {
    DEFAULT_QUERY_SETTINGS,
    TRANSACTION_MODES,
    isStreamingSupportedForMode,
    querySettingsRestoreSchema,
} from '../query';

import {useQueryStreamingSetting} from './useQueryStreamingSetting';
import {useSetting} from './useSetting';

export const useQueryExecutionSettings = () => {
    const enableTracingLevel = useTracingLevelOptionAvailable();
    const enableSnapshotReadWrite = useSnapshotReadWriteAvailable();
    const [storageSettings, setSettings] = useSetting<QuerySettings>(
        SETTING_KEYS.QUERY_EXECUTION_SETTINGS,
    );

    const validatedSettings = querySettingsRestoreSchema.parse(storageSettings);
    const [enableQueryStreaming] = useQueryStreamingSetting();

    const settings: QuerySettings = {
        ...validatedSettings,
        timeout:
            enableQueryStreaming && isStreamingSupportedForMode(validatedSettings.queryMode)
                ? validatedSettings.timeout || null
                : validatedSettings.timeout || undefined,
        tracingLevel: enableTracingLevel
            ? validatedSettings.tracingLevel
            : DEFAULT_QUERY_SETTINGS.tracingLevel,
        transactionMode:
            !enableSnapshotReadWrite &&
            validatedSettings.transactionMode === TRANSACTION_MODES.snapshotrw
                ? DEFAULT_QUERY_SETTINGS.transactionMode
                : validatedSettings.transactionMode,
    };

    return [settings, setSettings] as const;
};
