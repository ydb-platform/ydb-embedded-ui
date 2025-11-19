import type {Store} from '@reduxjs/toolkit';
import {createSelector, createSlice} from '@reduxjs/toolkit';
import {isNil} from 'lodash';

import {parseJson} from '../../../utils/utils';
import type {AppDispatch, RootState} from '../../defaultStore';

import type {SettingKey} from './constants';
import {DEFAULT_USER_SETTINGS, SETTINGS_OPTIONS} from './constants';
import type {SettingsState} from './types';
import {readSettingValueFromLS} from './utils';

export const initialState: SettingsState = {
    userSettings: {},
    systemSettings: window.systemSettings || {},
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: (create) => ({
        setSettingValue: create.reducer<{name: string; value: unknown}>((state, action) => {
            state.userSettings[action.payload.name] = action.payload.value;
        }),
    }),
});

export const getSettingValue = createSelector(
    (state: RootState) => state.settings.userSettings,
    (_state: RootState, name?: string) => name,
    (userSettings, name) => {
        if (!name) {
            return undefined;
        }

        const storeValue = userSettings[name];

        if (!isNil(storeValue)) {
            return storeValue;
        }

        const defaultValue = DEFAULT_USER_SETTINGS[name as SettingKey] as unknown;

        // Do not load LS value from always sync values.
        // In case there is no settings service
        // Such setting will be loaded from LS with getSingleSetting
        if (SETTINGS_OPTIONS[name]?.preventSyncWithLS) {
            return defaultValue;
        }

        const savedValue = readSettingValueFromLS(name);

        return savedValue;
    },
);

export const setSettingValue = (name: string | undefined, value: unknown) => {
    return (dispatch: AppDispatch) => {
        if (name) {
            dispatch(settingsSlice.actions.setSettingValue({name, value}));
        }
    };
};

export function syncUserSettingsFromLS(store: Store) {
    if (typeof window === 'undefined') {
        return;
    }

    window.addEventListener('storage', (event) => {
        if (event.key && event.key in DEFAULT_USER_SETTINGS) {
            const name = event.key as keyof typeof DEFAULT_USER_SETTINGS;
            let value = DEFAULT_USER_SETTINGS[name];
            if (event.newValue !== null) {
                value = parseJson(event.newValue);
            }
            store.dispatch(
                settingsSlice.actions.setSettingValue({
                    name,
                    value,
                }),
            );
        }
    });
}

export default settingsSlice.reducer;
