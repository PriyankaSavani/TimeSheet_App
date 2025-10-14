import React from 'react'
import { Navigate } from 'react-router-dom';
import { APICore } from '../helpers/api/apiCore';

const api = new APICore();

const Root = () => {
       const isAuthenticated = api.isUserAuthenticated();
       const url = isAuthenticated ? 'home' : 'auth/signIn';
       return <Navigate to={ `/${ url }` } />;
}

export default Root
