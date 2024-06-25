import type {Dispatch, PayloadAction} from '@reduxjs/toolkit';
import {createSlice} from '@reduxjs/toolkit';

import {settingsManager} from '../../services/settings';
import {AUTO_REFRESH_INTERVAL} from '../../utils/constants';

const autoRefreshLS = Number(settingsManager.readUserSettingsValue(AUTO_REFRESH_INTERVAL, 0));

export const autoRefreshControlSlice = createSlice({
    name: 'autoRefreshControl',
    initialState: {
        autoRefreshInterval: isNaN(autoRefreshLS) ? 0 : autoRefreshLS,
    },
    reducers: {
        setAutoRefreshInterval: (state, action: PayloadAction<number>) => {
            state.autoRefreshInterval = action.payload;
        },
    },
    selectors: {
        selectAutoRefreshInterval: (state) => state.autoRefreshInterval,
    },
});

export function setAutoRefreshInterval(interval: number) {
    return (dispatch: Dispatch) => {
        settingsManager.setUserSettingsValue(AUTO_REFRESH_INTERVAL, interval);
        dispatch(autoRefreshControlSlice.actions.setAutoRefreshInterval(interval));
    };
}

export const {selectAutoRefreshInterval} = autoRefreshControlSlice.selectors;
