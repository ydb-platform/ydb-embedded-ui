import type {Reducer} from 'redux';
import type {ThunkAction} from 'redux-thunk';

import {
    SAVED_QUERIES_KEY,
    THEME_KEY,
    TENANT_INITIAL_PAGE_KEY,
    INVERTED_DISKS_KEY,
    ASIDE_HEADER_COMPACT_KEY,
    USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
    PARTITIONS_HIDDEN_COLUMNS_KEY,
    QUERY_INITIAL_MODE_KEY,
    ENABLE_ADDITIONAL_QUERY_MODES,
    CLUSTER_INFO_HIDDEN_KEY,
    LAST_USED_QUERY_ACTION_KEY,
    USE_BACKEND_PARAMS_FOR_TABLES_KEY,
    LANGUAGE_KEY,
    DISPLAY_METRICS_CARDS_FOR_TENANT_DIAGNOSTICS,
    QUERY_USE_MULTI_SCHEMA_KEY,
} from '../../../utils/constants';
import '../../../services/api';
import {parseJson} from '../../../utils/utils';
import {QUERY_ACTIONS, QUERY_MODES} from '../../../utils/query';
import {
    readSavedSettingsValue,
    settingsApi,
    systemSettings,
    userSettings,
} from '../../../utils/settings';

import {TENANT_PAGES_IDS} from '../tenant/constants';

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

export const initialState = {
    problemFilter: ProblemFilterValues.ALL,
    userSettings: {
        ...userSettings,
        [THEME_KEY]: readSavedSettingsValue(THEME_KEY, 'system'),
        [LANGUAGE_KEY]: readSavedSettingsValue(LANGUAGE_KEY),
        [INVERTED_DISKS_KEY]: readSavedSettingsValue(INVERTED_DISKS_KEY, 'false'),
        [USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY]: readSavedSettingsValue(
            USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
            'false',
        ),
        [ENABLE_ADDITIONAL_QUERY_MODES]: readSavedSettingsValue(
            ENABLE_ADDITIONAL_QUERY_MODES,
            'true',
        ),
        [QUERY_USE_MULTI_SCHEMA_KEY]: readSavedSettingsValue(QUERY_USE_MULTI_SCHEMA_KEY, 'false'),
        [DISPLAY_METRICS_CARDS_FOR_TENANT_DIAGNOSTICS]: readSavedSettingsValue(
            DISPLAY_METRICS_CARDS_FOR_TENANT_DIAGNOSTICS,
            'true',
        ),
        [SAVED_QUERIES_KEY]: readSavedSettingsValue(SAVED_QUERIES_KEY, '[]'),
        [TENANT_INITIAL_PAGE_KEY]: readSavedSettingsValue(
            TENANT_INITIAL_PAGE_KEY,
            TENANT_PAGES_IDS.query,
        ),
        [QUERY_INITIAL_MODE_KEY]: readSavedSettingsValue(
            QUERY_INITIAL_MODE_KEY,
            QUERY_MODES.script,
        ),
        [LAST_USED_QUERY_ACTION_KEY]: readSavedSettingsValue(
            LAST_USED_QUERY_ACTION_KEY,
            QUERY_ACTIONS.execute,
        ),
        [ASIDE_HEADER_COMPACT_KEY]: readSavedSettingsValue(ASIDE_HEADER_COMPACT_KEY, 'true'),
        [PARTITIONS_HIDDEN_COLUMNS_KEY]: readSavedSettingsValue(PARTITIONS_HIDDEN_COLUMNS_KEY),
        [CLUSTER_INFO_HIDDEN_KEY]: readSavedSettingsValue(CLUSTER_INFO_HIDDEN_KEY, 'true'),
        [USE_BACKEND_PARAMS_FOR_TABLES_KEY]: readSavedSettingsValue(
            USE_BACKEND_PARAMS_FOR_TABLES_KEY,
            'false',
        ),
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
    return (dispatch) => {
        dispatch({type: SET_SETTING_VALUE, data: {name, value}});

        // If there is no settingsApi, use localStorage
        if (settingsApi) {
            window.api.postSetting(name, value);
        } else {
            try {
                localStorage.setItem(name, value);
            } catch {}
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

export const changeFilter = (filter: ProblemFilterValue) => {
    return {
        type: CHANGE_PROBLEM_FILTER,
        data: filter,
    } as const;
};

export const selectProblemFilter = (state: SettingsRootStateSlice) => state.settings.problemFilter;

export default settings;
