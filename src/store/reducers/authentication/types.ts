import type {AuthErrorResponse} from '../../../types/api/error';
import type {ApiRequestAction} from '../../utils';

import type {FETCH_USER, SET_AUTHENTICATED, SET_UNAUTHENTICATED} from './authentication';

export interface AuthenticationState {
    isAuthenticated: boolean;
    isUserAllowedToMakeChanges?: boolean;
    user: string | undefined;
    error: AuthErrorResponse | undefined;
}

export type AuthenticationAction =
    | ApiRequestAction<typeof SET_UNAUTHENTICATED, unknown, unknown>
    | ApiRequestAction<typeof SET_AUTHENTICATED, unknown, AuthErrorResponse>
    | ApiRequestAction<
          typeof FETCH_USER,
          {user: string | undefined; isUserAllowedToMakeChanges: boolean},
          unknown
      >;
