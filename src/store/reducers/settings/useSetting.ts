import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';

import {useTypedDispatch} from '../../../utils/hooks/useTypedDispatch';
import {useTypedSelector} from '../../../utils/hooks/useTypedSelector';

import {SUPERSEDED_SETTINGS_WRITE_ERROR, settingsApi} from './api';
import {getSettingValue, setSettingValue} from './settings';
import type {SettingSaveTarget} from './types';

type SaveSettingValue<T> = (value: T | undefined) => boolean;

export function useSetting<T>(
    name?: string,
    onSaveError?: (target: SettingSaveTarget) => void,
): {
    value: T | undefined;
    saveValue: SaveSettingValue<T>;
    isLoading: boolean;
} {
    const remoteAvailable = Boolean(window.api?.metaSettings);
    const dispatch = useTypedDispatch();

    const params = React.useMemo(() => {
        if (name && remoteAvailable) {
            return {name};
        }
        return skipToken;
    }, [remoteAvailable, name]);

    const {isLoading} = settingsApi.useGetSingleSettingQuery(params);
    const [setMetaSetting] = settingsApi.useSetSingleSettingMutation();
    const settingValue = useTypedSelector((state) => getSettingValue(state, name)) as T | undefined;

    const saveValue = React.useCallback<SaveSettingValue<T>>(
        (value) => {
            if (!name) {
                return false;
            }
            if (remoteAvailable) {
                const saveRequest = setMetaSetting({name, value});
                if (onSaveError) {
                    saveRequest.unwrap().catch((error: unknown) => {
                        if (
                            error &&
                            typeof error === 'object' &&
                            'name' in error &&
                            error.name === SUPERSEDED_SETTINGS_WRITE_ERROR
                        ) {
                            return;
                        }
                        onSaveError('remote');
                    });
                }
                return true;
            }
            const saved = dispatch(setSettingValue(name, value));
            if (!saved) {
                onSaveError?.('local');
            }
            return saved;
        },
        [dispatch, remoteAvailable, name, onSaveError, setMetaSetting],
    );

    return {value: settingValue, saveValue, isLoading} as const;
}
