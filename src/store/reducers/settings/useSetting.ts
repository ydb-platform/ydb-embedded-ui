import React from 'react';

import {useSetting as useLSSetting} from '../../../utils/hooks';
import {useTypedSelector} from '../../../utils/hooks/useTypedSelector';
import {selectMetaUser} from '../authentication/authentication';

import {settingsApi} from './api';

type SaveSettingValue<T> = (value: T | undefined) => void;

export function useSetting<T>(name?: string): {
    value: T | undefined;
    saveValue: SaveSettingValue<T>;
    isLoading: boolean;
} {
    const user = useTypedSelector(selectMetaUser);

    const {currentData: settingFromMeta, isLoading} = settingsApi.useGetSingleSettingQuery({
        user,
        name,
    });

    const [setMetaSetting] = settingsApi.useSetSingleSettingMutation();

    const [settingFromLS, saveSettingToLS] = useLSSetting(name);

    const settingValue = React.useMemo(() => {
        if (!name) {
            return undefined;
        }
        if (window.api.metaSettings) {
            return settingFromMeta;
        }
        return settingFromLS;
    }, [settingFromMeta, settingFromLS]);

    const saveValue = React.useCallback<SaveSettingValue<T>>(
        (value) => {
            if (!name) {
                return;
            }
            if (window.api.metaSettings) {
                setMetaSetting({user, name, value});
            } else {
                saveSettingToLS(value);
            }
        },
        [user, name, setMetaSetting, saveSettingToLS],
    );

    return {value: settingValue as T | undefined, saveValue, isLoading} as const;
}
