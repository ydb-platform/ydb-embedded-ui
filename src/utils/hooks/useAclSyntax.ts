import {SETTING_KEYS} from '../../store/reducers/settings/constants';
import {useSetting} from '../../store/reducers/settings/useSetting';
import {AclSyntax} from '../constants';

export function useAclSyntax(): string {
    const {value: aclSyntax} = useSetting<string | undefined>(SETTING_KEYS.ACL_SYNTAX);
    return aclSyntax ?? AclSyntax.YdbShort;
}
