import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';

import {useSetting as useLSSetting} from '../../../utils/hooks';
import {useTypedSelector} from '../../../utils/hooks/useTypedSelector';
import {selectMetaUser} from '../authentication/authentication';

import {settingsApi} from './api';
import {getSettingDefault} from './utils';

type SaveSettingValue<T> = (value: T | undefined) => void;

export function useSetting<T>(name?: string): {
    value: T | undefined;
    saveValue: SaveSettingValue<T>;
    isLoading: boolean;
} {
    const user = useTypedSelector(selectMetaUser);

    const params = React.useMemo(() => {
        if (user && name && window.api?.metaSettings) {
            return {user, name};
        }
        return skipToken;
    }, [user, name]);

    const {currentData: settingFromMeta, isLoading} = settingsApi.useGetSingleSettingQuery(params);

    const [setMetaSetting] = settingsApi.useSetSingleSettingMutation();

    const [settingFromLS, saveSettingToLS] = useLSSetting(name);

    const settingValue = React.useMemo(() => {
        if (!name) {
            return undefined;
        }
        const defaultValue = getSettingDefault(name);

        let value: unknown;

        if (window.api?.metaSettings) {
            value = settingFromMeta;
        } else {
            value = settingFromLS;
        }
        return value ?? defaultValue;
    }, [name, settingFromMeta, settingFromLS]);

    const saveValue = React.useCallback<SaveSettingValue<T>>(
        (value) => {
            if (!name) {
                return;
            }
            if (isNil(window.api?.metaSettings)) {
                saveSettingToLS(value);
            } else if (user) {
                setMetaSetting({user, name, value});
            }
        },
        [user, name, setMetaSetting, saveSettingToLS],
    );

    return {value: settingValue as T | undefined, saveValue, isLoading} as const;
}
