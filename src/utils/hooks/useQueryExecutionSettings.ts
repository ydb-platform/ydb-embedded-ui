import React from 'react';

import {
    useSnapshotReadWriteAvailable,
    useTracingLevelOptionAvailable,
} from '../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import type {QuerySettings} from '../../types/store/query';
import {
    DEFAULT_QUERY_SETTINGS,
    getEffectiveQueryTimeout,
    getEffectiveTransactionMode,
    querySettingsRestoreSchema,
} from '../query';

import {useQueryStreamingSetting} from './useQueryStreamingSetting';
import {useSetting} from './useSetting';

export const useQuerySettings = () => {
    const enableTracingLevel = useTracingLevelOptionAvailable();
    const [storageSettings, setSettings] = useSetting<QuerySettings>(
        SETTING_KEYS.QUERY_EXECUTION_SETTINGS,
    );

    const validatedSettings = React.useMemo(
        () => querySettingsRestoreSchema.parse(storageSettings),
        [storageSettings],
    );
    const [enableQueryStreaming] = useQueryStreamingSetting();
    const updateSettings = React.useCallback(
        (changes: Partial<QuerySettings>) => setSettings({...validatedSettings, ...changes}),
        [validatedSettings, setSettings],
    );

    const settings: QuerySettings = {
        ...validatedSettings,
        timeout: getEffectiveQueryTimeout(validatedSettings, enableQueryStreaming),
        tracingLevel: enableTracingLevel
            ? validatedSettings.tracingLevel
            : DEFAULT_QUERY_SETTINGS.tracingLevel,
    };

    return [settings, updateSettings] as const;
};

export const useQueryExecutionSettings = () => {
    const [settings, updateSettings] = useQuerySettings();
    const enableSnapshotReadWrite = useSnapshotReadWriteAvailable();
    const transactionMode = getEffectiveTransactionMode(
        settings.transactionMode,
        enableSnapshotReadWrite,
    );

    return [{...settings, transactionMode}, updateSettings] as const;
};
