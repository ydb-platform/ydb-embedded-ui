import type {Store} from '@reduxjs/toolkit';
import {createSlice} from '@reduxjs/toolkit';

import {settingsManager} from '../../../services/settings';
import {parseJson} from '../../../utils/utils';
import type {AppDispatch} from '../../defaultStore';

import {DEFAULT_USER_SETTINGS} from './constants';
import type {SettingsState} from './types';

const userSettings = settingsManager.extractSettingsFromLS(DEFAULT_USER_SETTINGS);
const systemSettings = window.systemSettings || {};

export const initialState: SettingsState = {
    userSettings,
    systemSettings,
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: (create) => ({
        setSettingValue: create.reducer<{name: string; value: unknown}>((state, action) => {
            state.userSettings[action.payload.name] = action.payload.value;
        }),
    }),
    selectors: {
        getSettingValue: (state, name?: string) => {
            if (!name) {
                return undefined;
            }

            return state.userSettings[name];
        },
    },
});

export const {getSettingValue} = settingsSlice.selectors;

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
