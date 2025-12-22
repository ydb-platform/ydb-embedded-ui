import {getSettingValue} from '../../store/reducers/settings/settings';
import {useSetting as useStoreSetting} from '../../store/reducers/settings/useSetting';

import {useTypedSelector} from './useTypedSelector';

export const useSetting = <T>(key?: string, defaultValue?: T): [T, (value: T) => void] => {
    const {saveValue} = useStoreSetting<T>(key);

    const settingValue = useTypedSelector((state) => {
        // Since we type setter value as T, we assume that received value is also T
        return (getSettingValue(state, key) ?? defaultValue) as T;
    });

    return [settingValue, saveValue];
};
