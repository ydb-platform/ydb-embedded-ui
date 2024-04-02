import type {SettingsObject} from '../../../services/settings';
import type {ValueOf} from '../../../types/common';

import type {
    ProblemFilterValues,
    SET_SETTING_VALUE,
    changeFilter,
    setUserSettings,
} from './settings';

export type ProblemFilterValue = ValueOf<typeof ProblemFilterValues>;

export interface SettingsState {
    problemFilter: ProblemFilterValue;
    userSettings: SettingsObject;
    systemSettings: SettingsObject;
}

export type SetSettingValueAction = {
    type: typeof SET_SETTING_VALUE;
    data: {name: string; value: unknown};
};

export type SettingsAction =
    | ReturnType<typeof changeFilter>
    | ReturnType<typeof setUserSettings>
    | SetSettingValueAction;

export interface SettingsRootStateSlice {
    settings: SettingsState;
}
