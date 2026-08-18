import {SETTING_KEYS} from '../../store/reducers/settings/constants';

import {useSetting} from './useSetting';

export const useQueryStreamingSetting = (): [boolean, (value: boolean) => void] => {
    return useSetting<boolean>(SETTING_KEYS.ENABLE_QUERY_STREAMING);
};
