import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectAuthState } from '../redux/auth/selectors';

interface PrivateRouteProps {
     children: React.ReactNode;
     roles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ( { children, roles } ) => {
     const { user, userLoggedIn } = useSelector( selectAuthState );

     if ( !userLoggedIn || !user ) {
          return <Navigate to="/auth/signIn" />;
     }

     if ( roles && !roles.includes( user.role ) ) {
          return <Navigate to="/access-denied" />;
     }

     return <>{ children }</>;
};

export default PrivateRoute;
