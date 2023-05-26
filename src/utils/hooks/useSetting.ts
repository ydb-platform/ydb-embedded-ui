import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import {getParsedSettingValue, setSettingValue} from '../../store/reducers/settings/settings';

import {useTypedSelector} from './useTypedSelector';

export const useSetting = <T>(key: string, defaultValue?: T): [T, (value: T) => void] => {
    const dispatch = useDispatch();

    const settingValue: T = useTypedSelector(
        (state) => getParsedSettingValue(state, key) ?? defaultValue,
    );

    const setValue = useCallback(
        (value: T) => {
            const preparedValue = typeof value === 'string' ? value : JSON.stringify(value);

            dispatch(setSettingValue(key, preparedValue));
        },
        [dispatch, key],
    );

    return [settingValue, setValue];
};
