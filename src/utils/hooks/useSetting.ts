import {useCallback} from 'react';

import {getSettingValue, setSettingValue} from '../../store/reducers/settings/settings';

import {useTypedSelector} from './useTypedSelector';
import {useTypedDispatch} from './useTypedDispatch';

export const useSetting = <T>(key: string, defaultValue?: T): [T, (value: T) => void] => {
    const dispatch = useTypedDispatch();

    const settingValue = useTypedSelector((state) => {
        // Since we type setter value as T, we assume that received value is also T
        return (getSettingValue(state, key) ?? defaultValue) as T;
    });

    const setValue = useCallback(
        (value: T) => {
            dispatch(setSettingValue(key, value));
        },
        [dispatch, key],
    );

    return [settingValue, setValue];
};
