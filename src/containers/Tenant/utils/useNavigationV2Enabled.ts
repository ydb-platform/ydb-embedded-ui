import {SETTING_KEYS} from '../../../store/reducers/settings/constants';
import {useSetting} from '../../../utils/hooks';

export function useNavigationV2Enabled() {
    const [enabled] = useSetting<boolean>(SETTING_KEYS.ENABLE_TENANT_NAVIGATION_V2);
    return Boolean(enabled);
}
