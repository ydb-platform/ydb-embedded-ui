import type {TUserToken} from '../../../types/api/whoami';

export interface AuthenticationState {
    isAuthenticated: boolean;
    isUserAllowedToMakeChanges?: boolean;
    isViewerUser?: boolean;

    user: string | undefined;
    id: string | undefined;

    metaUser: string | undefined;

    whoamiData: TUserToken | undefined;
}
