export type SettingsObject = Record<string, unknown>;

export interface SettingsState {
    userSettings: SettingsObject;
    systemSettings: SettingsObject;
}

export type SettingSaveTarget = 'local' | 'remote';

export interface SettingOptions {
    normalizeForMigration?: (value: unknown) => unknown;
    /** Save setting only to meta service */
    preventSyncWithLS?: boolean;
    /** Request setting immediatelly */
    preventBatching?: boolean;
}
