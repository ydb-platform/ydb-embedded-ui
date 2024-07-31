import type {QuerySettings} from '../../../../../types/store/query';
import {QUERY_SETTINGS_FIELD_SETTINGS} from '../../QuerySettingsDialog/constants';

import getChangedQueryExecutionSettings from './getChangedQueryExecutionSettings';

export default function getChangedQueryExecutionSettingsDescription({
    currentSettings,
    defaultSettings,
}: {
    currentSettings: QuerySettings;
    defaultSettings: QuerySettings;
}): Record<string, string> {
    const keys = getChangedQueryExecutionSettings(currentSettings, defaultSettings);
    const result: Record<string, string> = {};

    keys.forEach((key) => {
        const settings = QUERY_SETTINGS_FIELD_SETTINGS[key];
        const currentValue = currentSettings[key] as string;

        if ('options' in settings) {
            const content = settings.options.find((option) => option.value === currentValue)
                ?.content as string;

            result[settings.title] = content;
        } else {
            result[settings.title] = currentValue;
        }
    });

    return result;
}
