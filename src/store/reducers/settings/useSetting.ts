import React from 'react';

import {useTypedSelector} from '../../../utils/hooks/useTypedSelector';
import {selectID, selectUser} from '../authentication/authentication';

import {settingsApi} from './api';
import {getSettingValue} from './settings';

type SaveSettingValue<T> = (value: T | undefined) => void;

export function useSetting<T>(name?: string): {
    value: T | undefined;
    saveValue: SaveSettingValue<T>;
    isLoading: boolean;
} {
    const settingValue = useTypedSelector((state) => getSettingValue(state, name)) as T | undefined;

    const authUserSID = useTypedSelector(selectUser);
    const anonymousUserId = useTypedSelector(selectID);
    const user = authUserSID || anonymousUserId;

    const {isLoading} = settingsApi.useGetSingleSettingQuery({user, name});

    const [setMetaSetting] = settingsApi.useSetSingleSettingMutation();

    const saveValue = React.useCallback<SaveSettingValue<T>>(
        (value) => {
            setMetaSetting({user, name: name, value: value});
        },
        [user, name, setMetaSetting],
    );

    return {value: settingValue, saveValue, isLoading} as const;
}
