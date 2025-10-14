// constants
import { AuthActionTypes } from './constants';

export interface AuthActionType {
    type:
    | AuthActionTypes.API_RESPONSE_SUCCESS
    | AuthActionTypes.API_RESPONSE_ERROR
    | AuthActionTypes.FORGOT_PASSWORD
    | AuthActionTypes.FORGOT_PASSWORD_CHANGE
    | AuthActionTypes.SIGNIN_USER
    | AuthActionTypes.SIGNOUT_USER
    | AuthActionTypes.RESET
    | AuthActionTypes.SIGNUP_USER;
    payload: {} | string;
}

interface UserData {
    id: string;
    username: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: string;
    token: string;
}

// common success
export const authApiResponseSuccess = ( actionType: string, data: UserData | {} ): AuthActionType => ( {
    type: AuthActionTypes.API_RESPONSE_SUCCESS,
    payload: { actionType, data },
} );
// common error
export const authApiResponseError = ( actionType: string, error: string ): AuthActionType => ( {
    type: AuthActionTypes.API_RESPONSE_ERROR,
    payload: { actionType, error },
} );

export const signinUser = ( username: string, password: string ): AuthActionType => ( {
    type: AuthActionTypes.SIGNIN_USER,
    payload: { username, password },
} );

export const signoutUser = (): AuthActionType => ( {
    type: AuthActionTypes.SIGNOUT_USER,
    payload: {},
} );

export const signupUser = ( fullname: string, email: string, password: string ): AuthActionType => ( {
    type: AuthActionTypes.SIGNUP_USER,
    payload: { fullname, email, password },
} );

export const forgotPassword = ( username: string ): AuthActionType => ( {
    type: AuthActionTypes.FORGOT_PASSWORD,
    payload: { username },
} );

export const resetAuth = (): AuthActionType => ( {
    type: AuthActionTypes.RESET,
    payload: {},
} );
