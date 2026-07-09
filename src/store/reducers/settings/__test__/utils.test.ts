import {SETTING_KEYS} from '../constants';
import {getSettingDefault} from '../utils';

describe('settings utils', () => {
    test('disables blob storage capacity metrics by default', () => {
        expect(getSettingDefault(SETTING_KEYS.ENABLE_BLOB_STORAGE_CAPACITY_METRICS)).toBe(false);
    });
});
