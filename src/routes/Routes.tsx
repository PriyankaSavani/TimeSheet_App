import React from 'react'
import { Routes, Route, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux'

// selectors
import { selectLayoutState } from '../redux/layout/selectors'

// layout constants
import { LayoutTypes } from '../constants/layout'

// All layouts containers
import VerticalLayout from '../layout/VerticalLayout';
import DetachedLayout from '../layout/DetachedLayout';
import HorizontalLayout from '../layout/HorizontalLayout';
import TwoColumnLayout from '../layout/TwoColumnLayout';

import { authProtectedFlattenRoutes, publicProtectedFlattenRoutes } from './index'
import PrivateRoute from './PrivateRoute';

interface RoutesProps { }

const RoutesComponent = ( props: RoutesProps ) => {

     const { layout } = useSelector( selectLayoutState );

     const getLayout = () => {
          let layoutCls: any = TwoColumnLayout;

          switch ( layout.layoutType ) {
               case LayoutTypes.LAYOUT_HORIZONTAL:
                    layoutCls = HorizontalLayout;
                    break;
               case LayoutTypes.LAYOUT_DETACHED:
                    layoutCls = DetachedLayout;
                    break;
               case LayoutTypes.LAYOUT_VERTICAL:
                    layoutCls = VerticalLayout;
                    break;
               default:
                    layoutCls = TwoColumnLayout;
                    break;
          }
          return layoutCls;
     };

     let Layout = getLayout();

     return (
          <Routes>
               {/* Public routes */ }
               { publicProtectedFlattenRoutes.map( ( route: any, index: number ) => (
                    <Route key={ index } path={ route.path } element={ route.element } />
               ) ) }

               {/* Protected routes with persistent layout */ }
               <Route path="/" element={ <Layout { ...props }><Outlet /></Layout> }>
                    { authProtectedFlattenRoutes.map( ( route: any, index: number ) => (
                         <Route
                              key={ index }
                              path={ route.path === '/' ? undefined : route.path.replace( '/', '' ) }
                              index={ route.path === '/' }
                              element={
                                   route.route === PrivateRoute ? (
                                        <PrivateRoute roles={ route.roles }>
                                             { route.element }
                                        </PrivateRoute>
                                   ) : (
                                        route.element
                                   )
                              }
                         />
                    ) ) }
               </Route>
          </Routes>

     )
}

export default RoutesComponent
