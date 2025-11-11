import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {AclSyntax} from '../constants';

import {useSetting} from './useSetting';

export function useAclSyntax(): string {
    const [aclSyntax] = useSetting<string | undefined>(SETTING_KEYS.ACL_SYNTAX);

    return aclSyntax ?? AclSyntax.YdbShort;
}
