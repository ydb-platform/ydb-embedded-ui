import {setupListeners} from '@reduxjs/toolkit/query';

import {configureStore} from './configureStore';

export const {store, history} = configureStore();

// Set up listeners for RTK Query - required for features like skipPollingIfUnfocused
setupListeners(store.dispatch);

export type GetState = typeof store.getState;
export type RootState = ReturnType<GetState>;
export type AppDispatch = typeof store.dispatch;
