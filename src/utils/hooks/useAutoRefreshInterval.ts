import {AUTO_REFRESH_INTERVAL} from '../constants';

import {useSetting} from './useSetting';

export function useAutoRefreshInterval() {
    return useSetting(AUTO_REFRESH_INTERVAL, 0);
}
