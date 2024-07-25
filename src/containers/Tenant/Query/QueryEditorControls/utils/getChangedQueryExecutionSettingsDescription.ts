import type {QuerySettings} from '../../../../../types/store/query';
import {QUERY_SETTINGS_FIELD_SETTINGS} from '../../QuerySettingsDialog/constants';

import getChangedQueryExecutionSettings from './getChangedQueryExecutionSettings';

export default function getChangedQueryExecutionSettingsDescription({
    currentSettings,
    defaultSettings,
}: {
    currentSettings: QuerySettings;
    defaultSettings: QuerySettings;
}): string {
    const keys = getChangedQueryExecutionSettings(currentSettings, defaultSettings);
    return keys
        .map((key) => {
            const settings = QUERY_SETTINGS_FIELD_SETTINGS[key];
            const currentValue = currentSettings[key];

            if ('options' in settings) {
                const content = settings.options.find(
                    (option) => option.value === currentValue,
                )?.content;

                return `<span style="white-space: nowrap">${settings.title}: ${content}</span>`;
            }

            return `<span style="white-space: nowrap">${settings.title}: ${currentValue}</span>`;
        })
        .join(', ');
}
