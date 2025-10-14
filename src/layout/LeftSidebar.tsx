import React, { useEffect, useRef, useState } from 'react'
import { Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import AppMenu from './AppMenu';
import { getMenuItems } from '../helpers/menu';
import SimpleBar from 'simplebar-react';

interface LeftSidebarProps {
     isCondensed: boolean;
}

/* user box */
const UserBox = () => {
     // get the profilemenu
     const ProfileMenus = [
          {
               label: 'My Account',
               icon: 'fe-user',
               redirectTo: '/',
          },
          {
               label: 'Settings',
               icon: 'fe-settings',
               redirectTo: '/',
          },
          {
               label: 'Lock Screen',
               icon: 'fe-lock',
               redirectTo: '/auth/lock-screen',
          },
          {
               label: 'Sign Out',
               icon: 'fe-log-out',
               redirectTo: '/auth/signOut',
          },
     ];

     const [ dropdownOpen, setDropdownOpen ] = useState<boolean>( false );

     /*
      * toggle dropdown
      */
     const toggleDropdown = () => {
          setDropdownOpen( !dropdownOpen );
     };

     return (
          <div className="user-box text-center">
               {/* <img src={ profileImg } alt="" title="Mat Helme" className="rounded-circle avatar-md" /> */ }
               <Dropdown show={ dropdownOpen } onToggle={ toggleDropdown }>
                    <Dropdown.Toggle
                         id="dropdown-notification"
                         as="a"
                         onClick={ toggleDropdown }
                         className="cursor-pointer text-dark h5 mt-2 mb-1 d-block"
                    >
                         Geneva Kennedy
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="user-pro-dropdown">
                         <div onClick={ toggleDropdown }>
                              { ( ProfileMenus || [] ).map( ( item, index ) => {
                                   return (
                                        <Link
                                             to={ item.redirectTo }
                                             className="dropdown-item notify-item"
                                             key={ index + '-profile-menu' }
                                        >
                                             <i className={ `${ item.icon } me-1` }></i>
                                             <span>{ item.label }</span>
                                        </Link>
                                   );
                              } ) }
                         </div>
                    </Dropdown.Menu>
               </Dropdown>
               <p className="text-muted">Admin Head</p>
          </div>
     );
};

/* sidebar content */
const SideBarContent = () => {
     return (
          <>
               <UserBox />

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