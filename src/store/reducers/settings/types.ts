import type {ValueOf} from '../../../types/common';
import {changeFilter, ProblemFilterValues, SET_SETTING_VALUE} from './settings';

export type ProblemFilterValue = ValueOf<typeof ProblemFilterValues>;

export interface SettingsState {
    problemFilter: ProblemFilterValue;
    userSettings: Record<string, string | undefined>;
    systemSettings: Record<string, string | undefined>;
}

export type SetSettingValueAction = {
    type: typeof SET_SETTING_VALUE;
    data: {name: string; value: string};
};

export type SettingsAction = ReturnType<typeof changeFilter> | SetSettingValueAction;

export interface SettingsRootStateSlice {
    settings: SettingsState;
}
