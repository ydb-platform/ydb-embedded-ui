import type {TUserToken} from '../types/api/whoami';

export interface UserInfo {
    login: string;
    isSso: boolean;
}

function removeExternalIdpSuffix(userSid: string) {
    const suffixSeparatorIndex = userSid.lastIndexOf('@');

    return suffixSeparatorIndex > 0 ? userSid.slice(0, suffixSeparatorIndex) : userSid;
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
