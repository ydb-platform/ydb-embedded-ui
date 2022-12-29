import {
    ALL,
    SAVED_QUERIES_KEY,
    THEME_KEY,
    TENANT_INITIAL_TAB_KEY,
    QUERY_INITIAL_RUN_ACTION_KEY,
    INVERTED_DISKS_KEY,
    ASIDE_HEADER_COMPACT_KEY,
} from '../../utils/constants';
import '../../services/api';
import {getValueFromLS} from '../../utils/utils';

const CHANGE_PROBLEM_FILTER = 'settings/CHANGE_PROBLEM_FILTER';
const SET_SETTING_VALUE = 'settings/SET_VALUE';

const userSettings = window.userSettings || {};
const systemSettings = window.systemSettings || {};

export function readSavedSettingsValue(key, defaultValue) {
    const savedValue = window.web_version
        ? userSettings[key]
        : getValueFromLS(key);

    return savedValue ?? defaultValue;
}

// navigation managed its compact state internally before, and its approach is not compatible with settings
// try reading the old localStorage entry to use it as a default value, for backward compatibility
// assume it is safe to remove this code block if it is at least a few months old
// there a two of these, search for a similar comment
let legacyAsideNavCompactState = '';
try {
    legacyAsideNavCompactState = String(JSON.parse(getValueFromLS('nvAsideHeader')).isCompact);
    localStorage.removeItem('nvAsideHeader');
} catch {}

export const initialState = {
    problemFilter: ALL,
    userSettings: {
        ...userSettings,
        [THEME_KEY]: readSavedSettingsValue(THEME_KEY, 'light'),
        [INVERTED_DISKS_KEY]: readSavedSettingsValue(INVERTED_DISKS_KEY, 'false'),
        [SAVED_QUERIES_KEY]: readSavedSettingsValue(SAVED_QUERIES_KEY, '[]'),
        [TENANT_INITIAL_TAB_KEY]: readSavedSettingsValue(TENANT_INITIAL_TAB_KEY),
        [QUERY_INITIAL_RUN_ACTION_KEY]: readSavedSettingsValue(QUERY_INITIAL_RUN_ACTION_KEY),
        [ASIDE_HEADER_COMPACT_KEY]: readSavedSettingsValue(ASIDE_HEADER_COMPACT_KEY, legacyAsideNavCompactState || 'true'),
    },
    systemSettings,
};

const settings = (state = initialState, action) => {
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

export const setSettingValue = (name, value) => {
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

export const getSettingValue = (state, name) => {
    return state.settings.userSettings[name];
};

export const changeFilter = (filter) => {
    return {
        type: CHANGE_PROBLEM_FILTER,
        data: filter,
    };
};

export default settings;
