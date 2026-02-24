import React from 'react';

import {useTracingLevelOptionAvailable} from '../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import type {QuerySettings, StatisticsMode} from '../../types/store/query';
import {
    DEFAULT_QUERY_SETTINGS,
    QUERY_MODES,
    STATISTICS_MODES,
    STATISTICS_MODES_WITH_SVG,
    querySettingsRestoreSchema,
} from '../query';

import {useQueryStreamingSetting} from './useQueryStreamingSetting';
import {useSetting} from './useSetting';

function getSvgStatisticsMode(mode: StatisticsMode): StatisticsMode {
    return STATISTICS_MODES_WITH_SVG.includes(mode) ? mode : STATISTICS_MODES.full;
}

export const useQueryExecutionSettings = () => {
    const enableTracingLevel = useTracingLevelOptionAvailable();
    const [storageSettings, setSettings] = useSetting<QuerySettings>(
        SETTING_KEYS.QUERY_EXECUTION_SETTINGS,
    );

    const validatedSettings = querySettingsRestoreSchema.parse(storageSettings);
    const [useShowPlanToSvg] = useSetting<boolean>(SETTING_KEYS.USE_SHOW_PLAN_SVG);
    const [enableQueryStreaming] = useQueryStreamingSetting();

    const setQueryExecutionSettings = React.useCallback(
        (settings: QuerySettings) => {
            setSettings({
                ...settings,
                statisticsMode: useShowPlanToSvg
                    ? validatedSettings.statisticsMode
                    : settings.statisticsMode,
            });
        },
        [setSettings, useShowPlanToSvg, validatedSettings.statisticsMode],
    );

    const settings: QuerySettings = {
        ...validatedSettings,
        timeout:
            enableQueryStreaming && validatedSettings.queryMode === QUERY_MODES.query
                ? validatedSettings.timeout || null
                : validatedSettings.timeout || undefined,
        statisticsMode: useShowPlanToSvg
            ? getSvgStatisticsMode(validatedSettings.statisticsMode)
            : validatedSettings.statisticsMode,
        tracingLevel: enableTracingLevel
            ? validatedSettings.tracingLevel
            : DEFAULT_QUERY_SETTINGS.tracingLevel,
    };

    return [settings, setQueryExecutionSettings] as const;
};
