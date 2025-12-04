import React from "react";
import { Route } from "react-router-dom";
import Root from "./Root";
import PrivateRoute from "./PrivateRoute";
import TimesheetWrapper from "./TimesheetWrapper";
import ReportsWrapper from "./ReportsWrapper";

// lazy load all the views

// auth
const SignIn = React.lazy( () => import( '../pages/auth/SignIn' ) );
const SignUp = React.lazy( () => import( '../pages/auth/SignUp' ) );
const SignOut = React.lazy( () => import( '../pages/auth/SignOut' ) );

// dashboard
const Dashboard = React.lazy( () => import( '../pages/Admin/Dashboard' ) );

// access denied
const AccessDenied = React.lazy( () => import( '../pages/AccessDenied' ) );

// timesheet management
const Projects = React.lazy( () => import( '../pages/Admin/Projects' ) );
const Users = React.lazy( () => import( '../pages/Admin/Users' ) );

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
     roles: [ 'admin', 'user' ], // Allow both admin and user
};

const authRoutes: RoutesProps[] = [
     {
          path: '/auth/signIn',
          name: 'SignIn',
          element: <SignIn />,
          route: Route,
          roles: [ 'admin', 'user' ], // Allow both admin and user
     },
     {
          path: '/auth/signUp',
          name: 'SignUp',
          element: <SignUp />,
          route: Route,
          roles: [ 'admin', 'user' ], // Allow both admin and user
     },
     {
          path: '/auth/signOut',
          name: 'SignOut',
          element: <SignOut />,
          route: Route,
          roles: [ 'admin', 'user' ], // Allow both admin and user
     }
]

// dashboard
const dashboardRoutes: RoutesProps = {
     path: '/home',
     name: 'Dashboard',
     element: <Dashboard />,
     route: PrivateRoute,
     roles: [ 'admin' ],
}

// reports
const reportsRoutes: RoutesProps = {
     path: '/reports',
     name: 'Reports',
     element: <ReportsWrapper />, // Use a wrapper component to handle role-based rendering
     route: PrivateRoute,
     roles: [ 'admin', 'user' ],
}

// timesheet managemant
const projectsRoutes: RoutesProps = {
     path: '/projects',
     name: 'Projects',
     element: <Projects />,
     route: PrivateRoute,
     roles: [ 'admin' ],
}

const usersRoutes: RoutesProps = {
     path: '/users',
     name: 'Users',
     element: <Users />,
     route: PrivateRoute,
     roles: [ 'admin' ],
}

const timesheetRoutes: RoutesProps = {
     path: '/timesheet',
     name: 'Timesheet',
     element: <TimesheetWrapper />, // Use a wrapper component to handle role-based rendering
     route: PrivateRoute,
     roles: [ 'admin', 'user' ],
}

const timesheetManagementRoutes = [
     projectsRoutes,
     usersRoutes,
     timesheetRoutes,
]

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

// access denied route
const accessDeniedRoute: RoutesProps = {
     path: '/access-denied',
     name: 'Access Denied',
     element: <AccessDenied />,
     route: Route,
     roles: [ 'admin', 'user' ], // Allow both admin and user
}

// all routes
const authProtectedRoutes = [ rootRoute, dashboardRoutes, reportsRoutes, ...timesheetManagementRoutes ];
const publicRoutes = [ ...authRoutes, accessDeniedRoute ];

const authProtectedFlattenRoutes = flattenRoutes( [ ...authProtectedRoutes ] );
const publicProtectedFlattenRoutes = flattenRoutes( [ ...publicRoutes ] );

export { publicRoutes, authProtectedRoutes, authProtectedFlattenRoutes, publicProtectedFlattenRoutes };
