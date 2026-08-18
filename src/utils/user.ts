import type {TUserToken} from '../types/api/whoami';

export interface UserInfo {
    login: string;
    isSso: boolean;
}

const SSO_SUFFIX = '@sso';

function removeExternalIdpSuffix(userSid: string) {
    return userSid.endsWith(SSO_SUFFIX) ? userSid.slice(0, -SSO_SUFFIX.length) : userSid;
}

export function getUserInfo(userToken?: TUserToken): UserInfo | undefined {
    if (!userToken?.UserSID) {
        return undefined;
    }

    if (userToken.AuthType === 'Login') {
        return {
            login: userToken.UserSID,
            isSso: false,
        };
    }

    if (userToken.AuthType === 'ExternalIdp') {
        const login = removeExternalIdpSuffix(userToken.UserSID);

        return {
            login,
            isSso: true,
        };
    }

    return undefined;
}
