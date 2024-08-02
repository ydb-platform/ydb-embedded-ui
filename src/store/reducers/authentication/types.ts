export interface AuthenticationState {
    isAuthenticated: boolean;
    isUserAllowedToMakeChanges?: boolean;
    user: string | undefined;
}
