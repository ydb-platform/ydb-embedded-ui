export type SetSettingResponse = {ready?: boolean; status?: string} | undefined;

/**
 * Settings values are stored as strings. Complex values (objects/arrays) must be JSON-stringified on write
 * and parsed on read.
 */
export type SettingValue = string;

/**
 * Remote settings responses contain raw stored values (JSON strings) keyed by setting name.
 */
export type GetSettingResponse = Record<string, SettingValue | undefined>;
export interface GetSingleSettingParams {
    name: string;
}
export interface SetSingleSettingParams {
    name: string;
    value: SettingValue;
}
export interface GetSettingsParams {
    name: string[];
}
