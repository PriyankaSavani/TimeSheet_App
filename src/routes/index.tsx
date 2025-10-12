import React from "react";
import { Route } from "react-router-dom";
import Root from "./Root";
import PrivateRoute from "./PrivateRoute";

// lazy load all the views

// auth
const Login = React.lazy( () => import( '../pages/auth/LogIn' ) );

// dashboard
const Dashboard = React.lazy( () => import( '../pages/Dashboard' ) );

// timesheet management
const Projects = React.lazy( () => import( '../pages/Projects' ) );
const Timesheet = React.lazy( () => import( '../pages/Timesheet' ) );
const Tasks = React.lazy( () => import( '../pages/Tasks' ) );

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
          route: Route,
     }
]

// dashboard
const dashboardRoutes: RoutesProps = {
     path: '/home',
     name: 'Dashboard',
     element: <Dashboard />,
     route: PrivateRoute,
}

// timesheet managemant
const projectsRoutes: RoutesProps = {
     path: '/projects',
     name: 'Projects',
     element: <Projects />,
     route: PrivateRoute,
}

const timesheetRoutes: RoutesProps = {
     path: '/timesheet',
     name: 'Timesheet',
     element: <Timesheet />,
     route: PrivateRoute,
}

const tasksRoutes: RoutesProps = {
     path: '/tasks',
     name: 'Tasks',
     element: <Tasks />,
     route: PrivateRoute,
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
