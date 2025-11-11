export type SettingsObject = Record<string, unknown>;

export interface SettingsState {
    userSettings: SettingsObject;
    systemSettings: SettingsObject;
}

export interface SettingOptions {
    /** Save setting only to meta service */
    preventSyncWithLS?: boolean;
    /** Request setting immediatelly */
    preventBatching?: boolean;
}
