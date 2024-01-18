import type {Reducer} from 'redux';
import type {ThunkAction} from 'redux-thunk';

import {DEFAULT_USER_SETTINGS, SettingsObject, settingsManager} from '../../../services/settings';

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
export const SET_USER_SETTINGS = 'settings/SET_USER_SETTINGS';

export const ProblemFilterValues = {
    ALL: 'All',
    PROBLEMS: 'With problems',
} as const;

const userSettings = settingsManager.extractSettingsFromLS(DEFAULT_USER_SETTINGS);
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
        case SET_USER_SETTINGS: {
            return {
                ...state,
                userSettings: {
                    ...state.userSettings,
                    ...action.data,
                },
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

export const setUserSettings = (data: SettingsObject) => {
    return {type: SET_USER_SETTINGS, data} as const;
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
