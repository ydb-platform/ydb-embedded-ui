import {configureStore} from './configureStore';

export const {store, history} = configureStore();

export type GetState = typeof store.getState;
export type RootState = ReturnType<GetState>;
export type AppDispatch = typeof store.dispatch;
