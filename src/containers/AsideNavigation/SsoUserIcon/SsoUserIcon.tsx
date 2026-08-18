import {Icon} from '@gravity-ui/uikit';

import ssoUserIcon from '../../../assets/icons/sso-user.svg';

export function SsoUserIcon() {
    return <Icon data={ssoUserIcon} width={32} height={32} color="warning" qa="sso-user-icon" />;
}
