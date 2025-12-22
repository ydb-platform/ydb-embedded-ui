import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';

import {useTypedDispatch} from '../../../utils/hooks/useTypedDispatch';
import {useTypedSelector} from '../../../utils/hooks/useTypedSelector';

import {settingsApi} from './api';
import {getSettingValue, setSettingValue} from './settings';

type SaveSettingValue<T> = (value: T | undefined) => void;

export function useSetting<T>(name?: string): {
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
                return;
            }
            if (remoteAvailable) {
                setMetaSetting({name, value});
                return;
            }
            dispatch(setSettingValue(name, value));
        },
        [dispatch, remoteAvailable, name, setMetaSetting],
    );

    return {value: settingValue, saveValue, isLoading} as const;
}
