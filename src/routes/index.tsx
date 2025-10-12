import React from "react";
import { Route } from "react-router-dom";
import Root from "./Root";
import PrivateRoute from "./PrivateRoute";

// lazy load all the views

// auth
const Login = React.lazy( () => import( '../pages/auth/LogIn' ) );

// dashboard
const Dashboard = React.lazy( () => import( '../pages/dashboard/index' ) );

export interface RoutesProps {
     path: string;
     name?: string;
     // component?: RouteProps[ 'component' ];
     element: React.ReactElement;
     route?: any;
     // exact?: RouteProps[ 'exact' ];
     exact?: boolean;
     icon?: string;
     header?: string;
     roles?: string[];
     children?: RoutesProps[];
}

// root routes
const rootRoute: RoutesProps = {
     path: '/',
     exact: true,
     element: <Root />,
     route: PrivateRoute,
};

// auth
const authRoutes: RoutesProps[] = [
     {
          path: '/auth/login',
          name: 'Login',
          element: <Login />,
          // element: <React.Suspense fallback={ <div>Loading...</div> }><Login /></React.Suspense>,
          route: Route,
     }
]

// dashboard
const dashboardRoutes: RoutesProps = {
     path: '/home',
     name: 'Dashboard',
     element: <Dashboard />,
     // element: <PrivateRoute><React.Suspense fallback={ <div>Loading...</div> }><Dashboard /></React.Suspense></PrivateRoute>
     route: PrivateRoute,
}

// flatten the list of all nested routes
const flattenRoutes = ( routes: RoutesProps[] ) => {
     let flatRoutes: RoutesProps[] = [];

     routes = routes || [];
     routes.forEach( ( item: RoutesProps ) => {
          flatRoutes.push( item );

          if ( typeof item.children !== 'undefined' ) {
               flatRoutes = [ ...flatRoutes, ...flattenRoutes( item.children ) ];
          }
     } );
     return flatRoutes;
};

// all routes
const authProtectedRoutes = [ rootRoute, dashboardRoutes ];
const publicRoutes = [ ...authRoutes ];

const authProtectedFlattenRoutes = flattenRoutes( [ ...authProtectedRoutes ] );
const publicProtectedFlattenRoutes = flattenRoutes( [ ...publicRoutes ] );

export { publicRoutes, authProtectedRoutes, authProtectedFlattenRoutes, publicProtectedFlattenRoutes };
