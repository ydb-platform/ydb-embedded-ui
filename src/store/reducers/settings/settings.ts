import type {Reducer} from 'redux';
import type {ThunkAction} from 'redux-thunk';

import type {ValueOf} from '../../../types/common';
import {
    SAVED_QUERIES_KEY,
    THEME_KEY,
    TENANT_INITIAL_TAB_KEY,
    INVERTED_DISKS_KEY,
    ASIDE_HEADER_COMPACT_KEY,
    USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
    PARTITIONS_HIDDEN_COLUMNS_KEY,
    QUERY_INITIAL_MODE_KEY,
    ENABLE_ADDITIONAL_QUERY_MODES,
    CLUSTER_INFO_HIDDEN_KEY,
} from '../../../utils/constants';
import '../../../services/api';
import {getValueFromLS, parseJson} from '../../../utils/utils';
import {QueryModes} from '../../../types/store/query';

import type {RootState} from '..';
import type {
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

const userSettings = window.userSettings || {};
const systemSettings = window.systemSettings || {};

export function readSavedSettingsValue(key: string, defaultValue?: string) {
    const savedValue = window.web_version ? userSettings[key] : getValueFromLS(key);

    return savedValue ?? defaultValue;
}

export const initialState = {
    problemFilter: ProblemFilterValues.ALL,
    userSettings: {
        ...userSettings,
        [THEME_KEY]: readSavedSettingsValue(THEME_KEY, 'system'),
        [INVERTED_DISKS_KEY]: readSavedSettingsValue(INVERTED_DISKS_KEY, 'false'),
        [USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY]: readSavedSettingsValue(
            USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
            'false',
        ),
        [ENABLE_ADDITIONAL_QUERY_MODES]: readSavedSettingsValue(
            ENABLE_ADDITIONAL_QUERY_MODES,
            'false',
        ),
        [SAVED_QUERIES_KEY]: readSavedSettingsValue(SAVED_QUERIES_KEY, '[]'),
        [TENANT_INITIAL_TAB_KEY]: readSavedSettingsValue(TENANT_INITIAL_TAB_KEY),
        [QUERY_INITIAL_MODE_KEY]: readSavedSettingsValue(QUERY_INITIAL_MODE_KEY, QueryModes.script),
        [ASIDE_HEADER_COMPACT_KEY]: readSavedSettingsValue(ASIDE_HEADER_COMPACT_KEY, 'true'),
        [PARTITIONS_HIDDEN_COLUMNS_KEY]: readSavedSettingsValue(PARTITIONS_HIDDEN_COLUMNS_KEY),
        [CLUSTER_INFO_HIDDEN_KEY]: readSavedSettingsValue(CLUSTER_INFO_HIDDEN_KEY, 'false'),
    },
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
    value: string,
): ThunkAction<void, RootState, unknown, SetSettingValueAction> => {
    return (dispatch, getState) => {
        dispatch({type: SET_SETTING_VALUE, data: {name, value}});
        const {singleClusterMode} = getState();
        if (singleClusterMode) {
            localStorage.setItem(name, value);
        } else {
            window.api.postSetting(name, value);
        }
    };
};

export const getSettingValue = (state: SettingsRootStateSlice, name: string) => {
    return state.settings.userSettings[name];
};

/**
 * Returns parsed settings value.
 * If value cannot be parsed, returns initially stored string
 */
export const getParsedSettingValue = (state: SettingsRootStateSlice, name: string) => {
    const value = state.settings.userSettings[name];
    return parseJson(value);
};

export const changeFilter = (filter: ValueOf<typeof ProblemFilterValues>) => {
    return {
        type: CHANGE_PROBLEM_FILTER,
        data: filter,
    } as const;
};

export default settings;
