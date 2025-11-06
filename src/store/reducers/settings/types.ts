import type {SettingsObject} from '../../../services/settings';

export interface SettingsState {
    userSettings: SettingsObject;
    systemSettings: SettingsObject;
}
