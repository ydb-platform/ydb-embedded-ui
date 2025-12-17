export type SetSettingResponse = {ready?: boolean; status?: 'SUCCESS'} | undefined;

export type GetSettingResponse = Record<string, Setting>;
export interface Setting {
    /**
     * JSON string representation of the stored value.
     */
    value?: SettingValue;
}
export type SettingValue = string;
export interface GetSingleSettingParams {
    user: string;
    name: string;
}
export interface SetSingleSettingParams {
    user: string;
    name: string;
    value: SettingValue;
}
export interface GetSettingsParams {
    user: string;
    name: string[];
}
