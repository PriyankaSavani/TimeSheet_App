import React from 'react'
import { Navigate } from 'react-router-dom';
import { APICore } from '../helpers/api/apiCore';

const api = new APICore();

const Root = () => {
     const isAuthenticated = api.isUserAuthenticated();
     if ( !isAuthenticated ) {
          return <Navigate to="/auth/signIn" />;
     }
     const user = api.getLoggedInUser();
     const url = user && user.role === 'admin' ? 'home' : 'timesheet';
     return <Navigate to={ `/${ url }` } />;
}

export default Root
