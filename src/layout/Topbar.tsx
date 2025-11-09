import React from 'react'
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProfileDropdown from '../components/ProfileDropdown';

// logo
import logo from '../assets/images/logo/LOGO_LIGHT.png';

// images
import profilePic from '../assets/images/users/user-5.jpg';

// selectors
import { selectAuthState } from '../redux/auth/selectors';

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

const Topbar = ( { hideLogo, navCssClasses, openLeftMenuCallBack, topbarDark }: TopbarProps ) => {

     const { user } = useSelector( selectAuthState );

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