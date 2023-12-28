import type {Reducer} from 'redux';
import type {ThunkAction} from 'redux-thunk';

import '../../../services/api';
import {settingsManager} from '../../../services/settings';

import type {RootState} from '..';
import type {
    ProblemFilterValue,
    SetSettingValueAction,
    SettingsAction,
    SettingsRootStateSlice,
    SettingsState,
} from './types';

const CHANGE_PROBLEM_FILTER = 'settings/CHANGE_PROBLEM_FILTER';
export const SET_SETTING_VALUE = 'settings/SET_VALUE';

export const ProblemFilterValues = {
    ALL: 'All',
    PROBLEMS: 'With problems',
} as const;

const userSettings = settingsManager.getUserSettings();
const systemSettings = window.systemSettings || {};

export const initialState = {
    problemFilter: ProblemFilterValues.ALL,
    userSettings,
    systemSettings,
};

const settings: Reducer<SettingsState, SettingsAction> = (state = initialState, action) => {
    switch (action.type) {
        case CHANGE_PROBLEM_FILTER:
            return {
                ...state,
                problemFilter: action.data,
            };

        case SET_SETTING_VALUE: {
            const newSettings = {
                ...state.userSettings,
                [action.data.name]: action.data.value,
            };

            return {
                ...state,
                userSettings: newSettings,
            };
        }

        default:
            return state;
    }
};

export const setSettingValue = (
    name: string,
    value: unknown,
): ThunkAction<void, RootState, unknown, SetSettingValueAction> => {
    return (dispatch) => {
        dispatch({type: SET_SETTING_VALUE, data: {name, value}});

        settingsManager.setUserSettingsValue(name, value);
    };
};

export const getSettingValue = (state: SettingsRootStateSlice, name: string) => {
    return state.settings.userSettings[name];
};

export const changeFilter = (filter: ProblemFilterValue) => {
    return {
        type: CHANGE_PROBLEM_FILTER,
        data: filter,
    } as const;
};

export const selectProblemFilter = (state: SettingsRootStateSlice) => state.settings.problemFilter;

export default settings;
