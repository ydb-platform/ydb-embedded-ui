import {SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {applyStorageExpertModeSettingAvailability, getUserSettings} from '../settings';

function getExperimentSettingKeys(available: boolean) {
    return applyStorageExpertModeSettingAvailability(
        getUserSettings({singleClusterMode: true}),
        available,
    )
        .flatMap((page) => page.sections)
        .flatMap((section) => section.settings)
        .filter((setting) => 'settingKey' in setting)
        .map((setting) => setting.settingKey);
}

describe('applyStorageExpertModeSettingAvailability', () => {
    test('keeps storage expert mode setting when it is available', () => {
        expect(getExperimentSettingKeys(true)).toContain(SETTING_KEYS.ENABLE_STORAGE_EXPERT_MODE);
    });

    test('removes storage expert mode setting when it is unavailable', () => {
        expect(getExperimentSettingKeys(false)).not.toContain(
            SETTING_KEYS.ENABLE_STORAGE_EXPERT_MODE,
        );
    });
});
