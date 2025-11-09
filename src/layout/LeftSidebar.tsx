import React, { useEffect, useRef } from 'react'
import AppMenu from './AppMenu';
import { getMenuItems } from '../helpers/menu';
import SimpleBar from 'simplebar-react';

interface LeftSidebarProps {
     isCondensed: boolean;
}

/* sidebar content */
const SideBarContent = () => {
     return (
          <>
               <div id="sidebar-menu">
                    <AppMenu menuItems={ getMenuItems() } />
               </div>

               <div className="clearfix" />
          </>
     );
};

const LeftSidebar = ( { isCondensed }: LeftSidebarProps ) => {

     const menuNodeRef: any = useRef( null );

     /**
     * Handle the click anywhere in doc
     */
     const handleOtherClick = ( e: any ) => {
          if ( menuNodeRef && menuNodeRef.current && menuNodeRef.current.contains( e.target ) ) return;
          // else hide the menubar
          if ( document.body ) {
               document.body.classList.remove( 'sidebar-enable' );
          }
     };

     useEffect( () => {
          document.addEventListener( 'mousedown', handleOtherClick, false );

          return () => {
               document.removeEventListener( 'mousedown', handleOtherClick, false );
          };
     }, [] );

     return (
          <React.Fragment>
               <div className="left-side-menu" ref={ menuNodeRef }>
                    { !isCondensed && (
                         <SimpleBar style={ { maxHeight: '100%' } }>
                              <SideBarContent />
                         </SimpleBar>
                    ) }
                    { isCondensed && <SideBarContent /> }
               </div>
          </React.Fragment>
     )
}

export default LeftSidebar