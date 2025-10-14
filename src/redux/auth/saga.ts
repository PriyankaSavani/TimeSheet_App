import { all, fork, put, takeEvery, call } from 'redux-saga/effects';
import { SagaIterator } from '@redux-saga/core';

// helpers
import {
    signin as signinApi,
    signout as signoutApi,
    signup as signupApi,
    forgotPassword as forgotPasswordApi,
} from '../../helpers/';

// actions
import { authApiResponseSuccess, authApiResponseError } from './actions';

// constants
import { AuthActionTypes } from './constants';

interface UserData {
    payload: {
        username: string;
        password: string;
        fullname: string;
        email: string;
    };
    type: string;
}

/**
 * Signin the user
 * @param {*} payload - username and password
 */
function* signin ( { payload: { username, password }, type }: UserData ): SagaIterator {
    try {
        const user = yield call( signinApi, { username, password } );
        yield put( authApiResponseSuccess( AuthActionTypes.SIGNIN_USER, user ) );
    } catch ( error: any ) {
        yield put( authApiResponseError( AuthActionTypes.SIGNIN_USER, error.message || error ) );
    }
}

/**
 * Signout the user
 */
function* signout (): SagaIterator {
    try {
        yield call( signoutApi );
        yield put( authApiResponseSuccess( AuthActionTypes.SIGNOUT_USER, {} ) );
    } catch ( error: any ) {
        yield put( authApiResponseError( AuthActionTypes.SIGNOUT_USER, error.message || error ) );
    }
}

function* signup ( { payload: { fullname, email, password } }: UserData ): SagaIterator {
    try {
        const user = yield call( signupApi, { fullname, email, password } );
        yield put( authApiResponseSuccess( AuthActionTypes.SIGNUP_USER, user ) );
    } catch ( error: any ) {
        yield put( authApiResponseError( AuthActionTypes.SIGNUP_USER, error.message || error ) );
    }
}

function* forgotPassword ( { payload: { username } }: UserData ): SagaIterator {
    try {
        const response = yield call( forgotPasswordApi, { username } );
        yield put( authApiResponseSuccess( AuthActionTypes.FORGOT_PASSWORD, response ) );
    } catch ( error: any ) {
        yield put( authApiResponseError( AuthActionTypes.FORGOT_PASSWORD, error.message || error ) );
    }
}
export function* watchSigninUser () {
    yield takeEvery( AuthActionTypes.SIGNIN_USER, signin );
}

export function* watchSignout () {
    yield takeEvery( AuthActionTypes.SIGNOUT_USER, signout );
}

export function* watchSignup (): any {
    yield takeEvery( AuthActionTypes.SIGNUP_USER, signup );
}

export function* watchForgotPassword (): any {
    yield takeEvery( AuthActionTypes.FORGOT_PASSWORD, forgotPassword );
}

function* authSaga () {
    yield all( [ fork( watchSigninUser ), fork( watchSignout ), fork( watchSignup ), fork( watchForgotPassword ) ] );
}

export default authSaga;
