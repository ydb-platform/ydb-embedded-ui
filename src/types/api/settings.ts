export interface SetSettingResponse {
    ready: boolean;
    status: 'SUCCESS';
}
export type GetSettingResponse = Record<string, Setting>;
export interface Setting {
    user: string;
    name: string;
    value?: string | Record<string, string>;
}
export type SettingValue = string | Record<string, string>;
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
