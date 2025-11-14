export interface AuthenticationState {
    isAuthenticated: boolean;
    isUserAllowedToMakeChanges?: boolean;
    isViewerUser?: boolean;

    user: string | undefined;
    id: string | undefined;
}
