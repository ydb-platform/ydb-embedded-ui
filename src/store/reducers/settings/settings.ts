import {createSlice} from '@reduxjs/toolkit';

import type {AppDispatch} from '../../defaultStore';

import type {SettingsState} from './types';

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
    selectors: {
        getSettingValue: (state, name: string) => state.userSettings[name],
    },
});

export const {getSettingValue} = settingsSlice.selectors;

export function setSettingValue(name: string | undefined, value: unknown) {
    return (dispatch: AppDispatch) => {
        if (!name) {
            return;
        }

        dispatch(settingsSlice.actions.setSettingValue({name, value}));
    };
}

export default settingsSlice.reducer;
