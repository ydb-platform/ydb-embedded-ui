import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';

import {uiFactory} from '../../../uiFactory/uiFactory';
import {useTypedDispatch} from '../../../utils/hooks/useTypedDispatch';
import {useTypedSelector} from '../../../utils/hooks/useTypedSelector';
import {selectMetaUser} from '../authentication/authentication';

import {settingsApi} from './api';
import {getSettingValue, setSettingValue} from './settings';

type SaveSettingValue<T> = (value: T | undefined) => void;

export function useSetting<T>(name?: string): {
    value: T | undefined;
    saveValue: SaveSettingValue<T>;
    isLoading: boolean;
} {
    const fallbackUser = useTypedSelector(selectMetaUser);
    const userFromFactory = uiFactory.settingsBackend?.getUserId?.();
    const remoteAvailable = Boolean(window.api?.metaSettings);
    const user = userFromFactory ?? fallbackUser;
    const dispatch = useTypedDispatch();

    const params = React.useMemo(() => {
        if (user && name && remoteAvailable) {
            return {user, name};
        }
        return skipToken;
    }, [remoteAvailable, user, name]);

    const {isLoading} = settingsApi.useGetSingleSettingQuery(params);
    const [setMetaSetting] = settingsApi.useSetSingleSettingMutation();
    const settingValue = useTypedSelector((state) => getSettingValue(state, name)) as T | undefined;

    const saveValue = React.useCallback<SaveSettingValue<T>>(
        (value) => {
            if (!name) {
                return;
            }
            if (remoteAvailable && user) {
                setMetaSetting({user, name, value});
                return;
            }
            dispatch(setSettingValue(name, value));
        },
        [dispatch, remoteAvailable, user, name, setMetaSetting],
    );

    return {value: settingValue, saveValue, isLoading} as const;
}
