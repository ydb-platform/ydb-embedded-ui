import type {ValueOf} from '../../../types/common';
import type {SettingsObject} from '../../../services/settings';
import {changeFilter, ProblemFilterValues, SET_SETTING_VALUE} from './settings';

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

export type SettingsAction = ReturnType<typeof changeFilter> | SetSettingValueAction;

export interface SettingsRootStateSlice {
    settings: SettingsState;
}
