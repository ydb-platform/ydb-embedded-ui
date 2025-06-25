import {ACL_SYNTAX_KEY, AclSyntax} from '../constants';

import {useTypedSelector} from './useTypedSelector';

export function useAclSyntax(): string {
    const aclSyntax = useTypedSelector(
        (state) => state.settings.userSettings[ACL_SYNTAX_KEY] as string | undefined,
    );
    return aclSyntax ?? AclSyntax.YdbShort;
}
