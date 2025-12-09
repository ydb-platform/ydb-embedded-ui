import type {QuerySettings} from '../../../../../types/store/query';
import {RESOURCE_POOL_NO_OVERRIDE_VALUE} from '../../../../../utils/query';
import {QUERY_SETTINGS_FIELD_SETTINGS} from '../../QuerySettingsDialog/constants';
import formI18n from '../../QuerySettingsDialog/i18n';

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
        const currentValue = currentSettings[key];

        if ('options' in settings) {
            const content = settings.options.find(
                (option) => option.value === currentValue,
            )?.content;

            if (content) {
                result[settings.title] = content;
            }
        } else if (currentValue) {
            if (key === 'resourcePool' && currentValue === RESOURCE_POOL_NO_OVERRIDE_VALUE) {
                result[settings.title] = formI18n('form.resource-pool.no-override');
            } else {
                result[settings.title] = String(currentValue);
            }
        }
    });

    return result;
}
