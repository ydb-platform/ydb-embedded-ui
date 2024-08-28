import {useIsFrozenContext} from '../../components/NotRenderUntilFirstVisible/IsFrozenProvider';
import {AUTO_REFRESH_INTERVAL} from '../constants';

import {useSetting} from './useSetting';

export function useAutoRefreshInterval(): [number, (interval: number) => void] {
    const isFrozen = useIsFrozenContext();
    const [interval, setAutoRefreshInterval] = useSetting(AUTO_REFRESH_INTERVAL, 0);
    return isFrozen ? [0, setAutoRefreshInterval] : [interval, setAutoRefreshInterval];
}
