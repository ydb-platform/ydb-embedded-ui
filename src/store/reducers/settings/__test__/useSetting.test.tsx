import type React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {act, renderHook} from '@testing-library/react';
import {Provider} from 'react-redux';

import type {YdbEmbeddedAPI} from '../../../../services/api';
import type {SetSettingResponse} from '../../../../types/api/settings';
import {settingsApi} from '../api';
import {SETTING_KEYS} from '../constants';
import settings from '../settings';
import {useSetting} from '../useSetting';

const originalApi = window.api;
const settingName = SETTING_KEYS.SAVED_QUERIES;

function renderSetting(onSaveError: jest.Mock, name: string = settingName) {
    const store = configureStore({
        reducer: {settings, [settingsApi.reducerPath]: settingsApi.reducer},
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(settingsApi.middleware),
    });
    const wrapper = ({children}: {children: React.ReactNode}) => (
        <Provider store={store}>{children}</Provider>
    );

    return renderHook(() => useSetting<string[]>(name, onSaveError), {wrapper});
}

afterEach(() => {
    window.api = originalApi;
    jest.useRealTimers();
    jest.restoreAllMocks();
    localStorage.clear();
});

test.each([
    {
        name: SETTING_KEYS.QUERIES_HISTORY,
        keepsUnsavedValue: true,
    },
    {
        name: SETTING_KEYS.SAVED_QUERIES,
        keepsUnsavedValue: false,
    },
])('reports local storage failure for $name', ({name, keepsUnsavedValue}) => {
    window.api = {} as YdbEmbeddedAPI;
    const previousValue = ['SELECT 1;'];
    localStorage.setItem(name, JSON.stringify(previousValue));
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Storage is full', 'QuotaExceededError');
    });

    const onSaveError = jest.fn();
    const {result} = renderSetting(onSaveError, name);
    const value = ['SELECT 2;'];
    act(() => {
        expect(result.current.saveValue(value)).toBe(false);
    });

    expect(onSaveError).toHaveBeenCalledWith('local');
    expect(result.current.value).toEqual(keepsUnsavedValue ? value : previousValue);
    expect(localStorage.getItem(name)).toBe(JSON.stringify(previousValue));
});

test('keeps the queue moving without notifying on its timeout', async () => {
    jest.useFakeTimers();
    let finishSlowWrite: ((response: SetSettingResponse) => void) | undefined;
    const slowWrite = new Promise<SetSettingResponse>((resolve) => {
        finishSlowWrite = resolve;
    });
    const setSingleSetting = jest.fn().mockReturnValueOnce(slowWrite).mockRejectedValueOnce({
        status: 413,
    });
    window.api = {
        metaSettings: {getSingleSetting: async () => '[]', setSingleSetting},
    } as unknown as YdbEmbeddedAPI;

    const onSaveError = jest.fn();
    const {result} = renderSetting(onSaveError);
    await act(() => jest.advanceTimersByTimeAsync(0));
    expect(result.current.isLoading).toBe(false);

    act(() => result.current.saveValue(['SELECT 1;']));
    await act(() => jest.advanceTimersByTimeAsync(200));
    act(() => result.current.saveValue(['SELECT 2;']));

    await act(() => jest.advanceTimersByTimeAsync(10_000));
    expect(onSaveError).not.toHaveBeenCalled();
    expect(setSingleSetting).toHaveBeenCalledTimes(1);

    await act(() => jest.advanceTimersByTimeAsync(200));
    expect(setSingleSetting).toHaveBeenCalledTimes(2);
    expect(onSaveError).toHaveBeenCalledTimes(1);
    expect(onSaveError).toHaveBeenCalledWith('remote');
    await act(async () => finishSlowWrite?.({status: 'SUCCESS'}));
    expect(onSaveError).toHaveBeenCalledTimes(1);
});

test.each([
    {description: 'shows a failure from the current write after the timeout', newerWrite: false},
    {description: 'ignores a late failure after a newer write succeeds', newerWrite: true},
])('$description', async ({newerWrite}) => {
    jest.useFakeTimers();
    let rejectSlowWrite: ((error: unknown) => void) | undefined;
    const slowWrite = new Promise<SetSettingResponse>((_resolve, reject) => {
        rejectSlowWrite = reject;
    });
    const setSingleSetting = jest
        .fn()
        .mockReturnValueOnce(slowWrite)
        .mockResolvedValueOnce({status: 'SUCCESS'});
    window.api = {
        metaSettings: {getSingleSetting: async () => '[]', setSingleSetting},
    } as unknown as YdbEmbeddedAPI;

    const onSaveError = jest.fn();
    const {result} = renderSetting(onSaveError);
    await act(() => jest.advanceTimersByTimeAsync(0));

    act(() => result.current.saveValue(['SELECT 1;']));
    await act(() => jest.advanceTimersByTimeAsync(10_200));
    expect(setSingleSetting).toHaveBeenCalledTimes(1);
    expect(onSaveError).not.toHaveBeenCalled();

    if (newerWrite) {
        act(() => result.current.saveValue(['SELECT 2;']));
        await act(() => jest.advanceTimersByTimeAsync(200));
        expect(setSingleSetting).toHaveBeenCalledTimes(2);
    }

    await act(async () => rejectSlowWrite?.({status: 413}));
    if (newerWrite) {
        expect(onSaveError).not.toHaveBeenCalled();
    } else {
        expect(onSaveError).toHaveBeenCalledTimes(1);
        expect(onSaveError).toHaveBeenCalledWith('remote');
    }
});
