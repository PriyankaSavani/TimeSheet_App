import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ProfileDropdown from '../components/ProfileDropdown';
import FeatherIcon from 'feather-icons-react';
import { selectLayoutState } from '../redux/layout/selectors';
import { selectAuthState } from '../redux/auth/selectors';


// logo
import logo from '../assets/images/logo/LOGO_LIGHT.png';

// images
import profilePic from '../assets/images/users/user-5.jpg';


interface TopbarProps {
     hideLogo?: boolean;
     navCssClasses?: string;
     openLeftMenuCallBack?: () => void;
     topbarDark?: boolean;
}

// get the profilemenu
const ProfileMenus = [
     {
          label: 'My Account',
          icon: 'fe-user',
          redirectTo: '/my-account',
     },
     {
          label: 'Settings',
          icon: 'fe-settings',
          redirectTo: '/',
     },
     {
          label: 'Sign Out',
          icon: 'fe-log-out',
          redirectTo: '/auth/signOut',
     },
];

const Topbar = ( { hideLogo, navCssClasses, openLeftMenuCallBack, topbarDark }: TopbarProps ) => {

     const dispatch = useDispatch();
     const { user } = useSelector( selectAuthState );
     const { bsTheme } = useSelector( selectLayoutState );
     const [ isDark, setIsDark ] = useState( false );

     const toggleTheme = ( newTheme: 'light' | 'dark' ) => {
          console.log( 'Toggle to', newTheme );
          localStorage.setItem( 'bsTheme', newTheme );
          document.documentElement.setAttribute( 'data-bs-theme', newTheme );
          setIsDark( newTheme === 'dark' );
     };

     useEffect( () => {
          const saved = ( localStorage.getItem( 'bsTheme' ) as 'light' | 'dark' ) || bsTheme;
          document.documentElement.setAttribute( 'data-bs-theme', saved );
          setIsDark( saved === 'dark' );
          if ( saved !== bsTheme ) {
               dispatch( { type: '@@layout/CHANGE_BS_THEME', payload: saved } );
          }
     }, [ bsTheme, dispatch ] );

     const navbarCssClasses: string = navCssClasses || '';
     const containerCssClasses: string = !hideLogo ? 'container-fluid' : '';

     const username = user ? user.firstName + ' ' + user.lastName : 'JAYDEEP';
     const userTitle = user ? ( user.role === 'admin' ? 'Admin' : 'User' ) : 'Founder';


     return (
          <React.Fragment>
               <div className={ `navbar-custom ${ navbarCssClasses }` }>
                    <div className={ containerCssClasses }>
                         { !hideLogo && (
                              <div className="logo-box">
                                   <Link to="/" className="logo logo-dark text-center">
                                        <span className="logo-sm">
                                             {/* <img src={ logoSm } alt="" height="22" /> */ }
                                             <img
                                                  src={ logo }
                                                  alt='Timesheet App'
                                                  height='50'
                                             />
                                        </span>
                                        <span className="logo-lg">
                                             {/* <img
                                                                      src={ layoutType === LayoutTypes.LAYOUT_TWO_COLUMN ? logoDark2 : logoDark }
                                                                      alt=""
                                                                      height="20"
                                                               /> */}
                                             <img
                                                  src={ logo }
                                                  alt='Timesheet App'
                                                  height='50'
                                             />
                                        </span>
                                   </Link>
                                   <Link to="/" className="logo logo-light text-center">
                                        <span className="logo-sm">
                                             {/* <img src={ logoSm } alt="" height="22" /> */ }
                                             <img
                                                  src={ logo }
                                                  alt='Timesheet App'
                                                  height='50'
                                             />
                                        </span>
                                        <span className="logo-lg">
                                             {/* <img
                                                                      src={ layoutType === LayoutTypes.LAYOUT_TWO_COLUMN ? logoLight2 : logoLight }
                                                                      alt=""
                                                                      height="20"
                                                               /> */}
                                             <img
                                                  src={ logo }
                                                  alt='Timesheet App'
                                                  height='50'
                                             />
                                        </span>
                                   </Link>
                              </div>
                         ) }
                         <ul className="list-unstyled topnav-menu float-end mb-0">
                              <li className="dropdown notification-list">
                                   <Link
                                        to="#"
                                        className='nav-link'
                                        onClick={ () => toggleTheme( isDark ? 'light' : 'dark' ) }
                                   >
                                        <FeatherIcon
                                             icon={ isDark ? "sun" : "moon" }
                                             className="icon-xs"
                                        />
                                   </Link>
                                   {/* Dropdown removed - simple toggle button */ }
                              </li>
                              <li className="dropdown notification-list topbar-dropdown">
                                   <ProfileDropdown
                                        profilePic={ profilePic }
                                        menuItems={ ProfileMenus }
                                        username={ username }
                                        userTitle={ userTitle }
                                   />
                              </li>
                         </ul>

                    </div>
               </div>
          </React.Fragment>
     )
}

export default Topbar