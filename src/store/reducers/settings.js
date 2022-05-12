import {ALL, defaultUserSettings, SAVED_QUERIES_KEY, THEME_KEY, TENANT_INITIAL_TAB_KEY} from '../../utils/constants';
import '../../services/api';
import {getValueFromLS} from '../../utils/utils';

const CHANGE_PROBLEM_FILTER = 'settings/CHANGE_PROBLEM_FILTER';
const SET_SETTING_VALUE = 'settings/SET_VALUE';

const userSettings = window.userSettings || {};
const systemSettings = window.systemSettings || {};
const theme = window.web_version
    ? userSettings.theme || 'light'
    : getValueFromLS(THEME_KEY, 'light');
const savedQueries = window.web_version
    ? userSettings[SAVED_QUERIES_KEY]
    : getValueFromLS(SAVED_QUERIES_KEY, '[]');
const savedTenantGeneralTab = window.web_version
    ? userSettings[TENANT_INITIAL_TAB_KEY]
    : getValueFromLS(TENANT_INITIAL_TAB_KEY);

export const initialState = {
    problemFilter: ALL,
    userSettings: {
        ...defaultUserSettings,
        ...userSettings,
        theme,
        [SAVED_QUERIES_KEY]: savedQueries,
        [TENANT_INITIAL_TAB_KEY]: savedTenantGeneralTab,
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
