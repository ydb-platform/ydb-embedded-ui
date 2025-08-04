export interface AuthenticationState {
    isAuthenticated: boolean;
    isUserAllowedToMakeChanges?: boolean;
    isOnlyDatabaseUser?: boolean;
    user: string | undefined;
}
