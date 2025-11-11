import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';
import {debounce} from 'lodash';

import type {SetSingleSettingParams} from '../../../types/api/settings';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {useTypedDispatch} from '../../../utils/hooks/useTypedDispatch';
import {useTypedSelector} from '../../../utils/hooks/useTypedSelector';
import {selectID, selectUser} from '../authentication/authentication';

import {settingsApi} from './api';
import type {SettingKey} from './constants';
import {DEFAULT_USER_SETTINGS, SETTINGS_OPTIONS} from './constants';
import {getSettingValue, setSettingValue} from './settings';
import {
    deleteValueFromLS,
    parseSettingValue,
    readSettingValueFromLS,
    setSettingValueToLS,
    stringifySettingValue,
} from './utils';

type SaveSettingValue<T> = (value: T | undefined) => void;

interface UseSettingOptions {
    /** Time before setting will be set */
    debounceTime?: number;
}

export function useSetting<T>(
    name?: string,
    {debounceTime = 0}: UseSettingOptions = {},
): {value: T | undefined; saveValue: SaveSettingValue<T>; isLoading: boolean} {
    const dispatch = useTypedDispatch();

    const preventSyncWithLS = Boolean(name && SETTINGS_OPTIONS[name]?.preventSyncWithLS);

    const settingValue = useTypedSelector((state) => getSettingValue(state, name)) as T | undefined;

    const authUserSID = useTypedSelector(selectUser);
    const anonymosUserId = useTypedSelector(selectID);

    const user = authUserSID || anonymosUserId;
    const shouldUseMetaSettings = uiFactory.useMetaSettings && user && name;

    const shouldUseOnlyExternalSettings = shouldUseMetaSettings && preventSyncWithLS;

    const params = React.useMemo(() => {
        return shouldUseMetaSettings ? {user, name} : skipToken;
    }, [shouldUseMetaSettings, user, name]);

    const {currentData: metaSetting, isLoading: isSettingLoading} =
        settingsApi.useGetSingleSettingQuery(params);

    const [setMetaSetting] = settingsApi.useSetSingleSettingMutation();

    // Add loading state to settings that are stored externally
    const isLoading = shouldUseMetaSettings ? isSettingLoading : false;

    // Load initial value
    React.useEffect(() => {
        let value = name ? (DEFAULT_USER_SETTINGS[name as SettingKey] as T | undefined) : undefined;

        if (!shouldUseOnlyExternalSettings) {
            const savedValue = readSettingValueFromLS<T>(name);
            value = savedValue ?? value;
        }

        dispatch(setSettingValue(name, value));
    }, [name, shouldUseOnlyExternalSettings, dispatch]);

    // Sync value from backend with LS and store
    React.useEffect(() => {
        if (shouldUseMetaSettings && metaSetting?.value) {
            if (!shouldUseOnlyExternalSettings) {
                setSettingValueToLS(name, metaSetting.value);
            }
            const parsedValue = parseSettingValue<T>(metaSetting.value);
            dispatch(setSettingValue(name, parsedValue));
        }
    }, [shouldUseOnlyExternalSettings, metaSetting, name, dispatch]);

    // Load local value to backend
    React.useEffect(() => {
        const savedValue = readSettingValueFromLS<T>(name);

        const isMetaSettingEmpty = !isSettingLoading && !metaSetting?.value;

        if (shouldUseMetaSettings && isMetaSettingEmpty && savedValue) {
            setMetaSetting({name, user, value: stringifySettingValue(savedValue)})
                .unwrap()
                .then(() => {
                    if (shouldUseOnlyExternalSettings) {
                        deleteValueFromLS(name);
                    }
                })
                .catch((error) => {
                    console.error('Failed to set setting via meta API:', error);
                });
        }
    }, [
        shouldUseMetaSettings,
        shouldUseOnlyExternalSettings,
        metaSetting,
        isSettingLoading,
        name,
        user,
        setMetaSetting,
    ]);

    const debouncedSetMetaSetting = React.useMemo(
        () =>
            debounce((params: SetSingleSettingParams) => {
                setMetaSetting(params);
            }, debounceTime),
        [debounceTime, setMetaSetting],
    );

    // Call debounced func on component unmount
    React.useEffect(() => {
        return () => debouncedSetMetaSetting.flush();
    }, [debouncedSetMetaSetting]);

    const saveValue = React.useCallback<SaveSettingValue<T>>(
        (value) => {
            if (shouldUseMetaSettings) {
                debouncedSetMetaSetting({
                    user,
                    name: name,
                    value: stringifySettingValue(value),
                });
            }

            if (!shouldUseOnlyExternalSettings) {
                setSettingValueToLS(name, value);
            }
        },
        [shouldUseOnlyExternalSettings, user, name, debouncedSetMetaSetting],
    );

    return {value: settingValue, saveValue, isLoading} as const;
}
