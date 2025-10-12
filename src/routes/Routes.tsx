import React from 'react'
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux'

// store
import { RootState } from '../redux/store'

// layout constants
import { LayoutTypes } from '../constants/layout'

// All layouts containers
import DefaultLayout from '../layout/DefaultLayout';
import VerticalLayout from '../layout/VerticalLayout';
import DetachedLayout from '../layout/DetachedLayout';
import HorizontalLayout from '../layout/HorizontalLayout';
import TwoColumnLayout from '../layout/TwoColumnLayout';

import { authProtectedFlattenRoutes, publicProtectedFlattenRoutes } from './index'

interface RoutesProps { }

const RoutesComponent = ( props: RoutesProps ) => {

     const { layout } = useSelector( ( state: RootState ) => ( {
          layout: state.Layout,
     } ) );

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
               { publicProtectedFlattenRoutes.map( ( route: any, index: number ) => (
                    <Route key={ index } path={ route.path } element={ <DefaultLayout { ...props } layout={ layout }>{ route.element }</DefaultLayout> } />
               ) ) }
               { authProtectedFlattenRoutes.map( ( route: any, index: number ) => (
                    <Route key={ index } path={ route.path } element={ <Layout { ...props }>{ route.element }</Layout> } />
               ) ) }
          </Routes>
     )
}

export default RoutesComponent
