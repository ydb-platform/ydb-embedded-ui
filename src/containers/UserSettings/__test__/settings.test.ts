import {DEFAULT_USER_SETTINGS, SETTING_KEYS} from '../../../store/reducers/settings/constants';
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

describe('getUserSettings', () => {
    test('exposes compact PDisk previews as an experiment disabled by default', () => {
        expect(getExperimentSettingKeys(true)).toContain(SETTING_KEYS.ENABLE_PDISKS_PREVIEW);
        expect(getExperimentSettingKeys(false)).toContain(SETTING_KEYS.ENABLE_PDISKS_PREVIEW);
        expect(DEFAULT_USER_SETTINGS[SETTING_KEYS.ENABLE_PDISKS_PREVIEW]).toBe(false);
    });

    test('does not expose the removed network table experiment', () => {
        expect(getExperimentSettingKeys(true)).not.toContain('enableNetworkTable');
    });
});
