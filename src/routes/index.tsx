import React from "react";
import { Route } from "react-router-dom";
import Root from "./Root";
import PrivateRoute from "./PrivateRoute";

// lazy load all the views

// auth
const SignIn = React.lazy( () => import( '../pages/auth/SignIn' ) );
const SignUp = React.lazy( () => import( '../pages/auth/SignUp' ) );
const SignOut = React.lazy( () => import( '../pages/auth/SignOut' ) );

// dashboard
const Dashboard = React.lazy( () => import( 'pages/Dashboard/index' ) );

// timesheet management
const Projects = React.lazy( () => import( '../pages/Projects/index' ) );
const Timesheet = React.lazy( () => import( '../pages/Timesheet/index' ) );
const Tasks = React.lazy( () => import( '../pages/Tasks/index' ) );

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

// timesheet managemant
const projectsRoutes: RoutesProps = {
     path: '/projects',
     name: 'Projects',
     element: <Projects />,
     route: PrivateRoute,
     roles: [ 'admin' ],
}

const timesheetRoutes: RoutesProps = {
     path: '/timesheet',
     name: 'Timesheet',
     element: <Timesheet />,
     route: PrivateRoute,
     roles: [ 'admin', 'user' ], // Allow both admin and user
}

const tasksRoutes: RoutesProps = {
     path: '/tasks',
     name: 'Tasks',
     element: <Tasks />,
     route: PrivateRoute,
     roles: [ 'admin' ],
}

const timesheetManagementRoutes = [
     projectsRoutes,
     timesheetRoutes,
     tasksRoutes
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

// all routes
const authProtectedRoutes = [ rootRoute, dashboardRoutes, ...timesheetManagementRoutes ];
const publicRoutes = [ ...authRoutes ];

const authProtectedFlattenRoutes = flattenRoutes( [ ...authProtectedRoutes ] );
const publicProtectedFlattenRoutes = flattenRoutes( [ ...publicRoutes ] );

export { publicRoutes, authProtectedRoutes, authProtectedFlattenRoutes, publicProtectedFlattenRoutes };
