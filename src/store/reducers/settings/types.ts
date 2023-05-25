import {changeFilter, SET_SETTING_VALUE} from './settings';

export enum ProblemFilterValues {
    ALL = 'All',
    PROBLEMS = 'With problems',
}

export interface SettingsState {
    problemFilter: ProblemFilterValues;
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
