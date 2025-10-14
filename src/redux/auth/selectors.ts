import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const selectAuthState = createSelector(
     ( state: RootState ) => state.Auth,
     ( auth ) => ( {
          user: auth.user,
          userLoggedIn: auth.userLoggedIn,
          loading: auth.loading,
          error: auth.error,
     } )
);
