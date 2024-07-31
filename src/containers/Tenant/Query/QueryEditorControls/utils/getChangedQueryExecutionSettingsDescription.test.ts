import type {QuerySettings} from '../../../../../types/store/query';
import {
    ISOLATION_LEVELS,
    ISOLATION_LEVELS_TITLES,
    QUERY_MODES,
    QUERY_MODES_TITLES,
    STATISTICS_MODES,
    STATISTICS_MODES_TITLES,
    TRACING_LEVELS,
    TRACING_LEVELS_TITLES,
} from '../../../../../utils/query';
import {QUERY_SETTINGS_FIELD_SETTINGS} from '../../QuerySettingsDialog/constants';

import getChangedQueryExecutionSettingsDescription from './getChangedQueryExecutionSettingsDescription';

const DEFAULT_QUERY_SETTINGS: QuerySettings = {
    queryMode: QUERY_MODES.script,
    isolationLevel: ISOLATION_LEVELS.serializable,
    timeout: '60',
    statisticsMode: STATISTICS_MODES.none,
    tracingLevel: TRACING_LEVELS.detailed,
};

describe('getChangedQueryExecutionSettingsDescription', () => {
    it('should return an empty object if no settings changed', () => {
        const currentSettings: QuerySettings = {...DEFAULT_QUERY_SETTINGS};

        const result = getChangedQueryExecutionSettingsDescription({
            currentSettings,
            defaultSettings: DEFAULT_QUERY_SETTINGS,
        });

        expect(result).toEqual({});
    });

    it('should return the description for changed settings', () => {
        const currentSettings: QuerySettings = {
            ...DEFAULT_QUERY_SETTINGS,
            queryMode: QUERY_MODES.pg,
            timeout: '63',
        };

        const result = getChangedQueryExecutionSettingsDescription({
            currentSettings,
            defaultSettings: DEFAULT_QUERY_SETTINGS,
        });

        expect(result).toEqual({
            [QUERY_SETTINGS_FIELD_SETTINGS.queryMode.title]:
                QUERY_SETTINGS_FIELD_SETTINGS.queryMode.options.find(
                    (option) => option.value === QUERY_MODES.pg,
                )?.content,
            [QUERY_SETTINGS_FIELD_SETTINGS.timeout.title]: '63',
        });
    });

    it('should return the correct description for all changed settings', () => {
        const currentSettings: QuerySettings = {
            queryMode: QUERY_MODES.data,
            isolationLevel: ISOLATION_LEVELS.snapshot,
            timeout: '120',
            statisticsMode: STATISTICS_MODES.profile,
            tracingLevel: TRACING_LEVELS.diagnostic,
        };

        const result = getChangedQueryExecutionSettingsDescription({
            currentSettings,
            defaultSettings: DEFAULT_QUERY_SETTINGS,
        });

        expect(result).toEqual({
            [QUERY_SETTINGS_FIELD_SETTINGS.queryMode.title]: QUERY_MODES_TITLES.data,
            [QUERY_SETTINGS_FIELD_SETTINGS.isolationLevel.title]:
                ISOLATION_LEVELS_TITLES['snapshot-read-only'],
            [QUERY_SETTINGS_FIELD_SETTINGS.timeout.title]: '120',
            [QUERY_SETTINGS_FIELD_SETTINGS.statisticsMode.title]: STATISTICS_MODES_TITLES.profile,
            [QUERY_SETTINGS_FIELD_SETTINGS.tracingLevel.title]: TRACING_LEVELS_TITLES.diagnostic,
        });
    });
});
