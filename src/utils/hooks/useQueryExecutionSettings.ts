import React from 'react';

import {useTracingLevelOptionAvailable} from '../../store/reducers/capabilities/hooks';
import type {QuerySettings} from '../../types/store/query';
import {QUERY_EXECUTION_SETTINGS_KEY, USE_SHOW_PLAN_SVG_KEY} from '../constants';
import {DEFAULT_QUERY_SETTINGS, STATISTICS_MODES, querySettingsRestoreSchema} from '../query';

import {useSetting} from './useSetting';

export const useQueryExecutionSettings = () => {
    const enableTracingLevel = useTracingLevelOptionAvailable();
    const [storageSettings, setSettings] = useSetting<QuerySettings>(QUERY_EXECUTION_SETTINGS_KEY);

    const validatedSettings = querySettingsRestoreSchema.parse(storageSettings);
    const [useShowPlanToSvg] = useSetting<boolean>(USE_SHOW_PLAN_SVG_KEY);

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
        statisticsMode: useShowPlanToSvg ? STATISTICS_MODES.full : validatedSettings.statisticsMode,
        tracingLevel: enableTracingLevel
            ? validatedSettings.tracingLevel
            : DEFAULT_QUERY_SETTINGS.tracingLevel,
    };

    return [settings, setQueryExecutionSettings] as const;
};
