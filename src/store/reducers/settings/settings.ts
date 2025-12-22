import type {Store} from '@reduxjs/toolkit';
import {createSelector, createSlice} from '@reduxjs/toolkit';
import {isNil} from 'lodash';

import {parseJson} from '../../../utils/utils';
import type {AppDispatch, RootState} from '../../defaultStore';

import {DEFAULT_USER_SETTINGS} from './constants';
import type {SettingsState} from './types';
import {
    getSettingDefault,
    readSettingValueFromLS,
    setSettingValueToLS,
    shouldSyncSettingToLS,
} from './utils';

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

export const setSettingValueInStore = settingsSlice.actions.setSettingValue;

/**
 * Reads LS value or use default when store value undefined
 *
 * If there is value in store, returns it
 */
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

        const defaultValue = getSettingDefault(name);
        if (!shouldSyncSettingToLS(name)) {
            return defaultValue;
        }

        const savedValue = readSettingValueFromLS(name);

        return savedValue ?? defaultValue;
    },
);

export const setSettingValue = (name: string | undefined, value: unknown) => {
    return (dispatch: AppDispatch) => {
        if (name) {
            dispatch(settingsSlice.actions.setSettingValue({name, value}));
            if (shouldSyncSettingToLS(name)) {
                setSettingValueToLS(name, value);
            }
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

export function preloadUserSettingsFromLS(store: Store) {
    if (typeof window === 'undefined') {
        return;
    }

    Object.keys(DEFAULT_USER_SETTINGS).forEach((name) => {
        if (!shouldSyncSettingToLS(name)) {
            return;
        }

        const savedValue = readSettingValueFromLS(name);
        if (isNil(savedValue)) {
            return;
        }

        store.dispatch(settingsSlice.actions.setSettingValue({name, value: savedValue}));
    });
}

export default settingsSlice.reducer;
