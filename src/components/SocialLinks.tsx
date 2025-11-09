import classNames from 'classnames';
import FeatherIcon from 'feather-icons-react';
import React from 'react'
import { Link } from 'react-router-dom';

const SocialLinks = () => {

     const socialLinks = [
          {
               variant: 'primary',
               icon: 'facebook',
          },
          {
               variant: 'danger',
               icon: 'chrome',
          },
     ];

     return (
          <React.Fragment>
               <ul className="social-list list-inline mt-3 mb-0">
                    { ( socialLinks || [] ).map( ( item, index ) => {
                         return (
                              <li key={ index } className="list-inline-item">
                                   <Link
                                        to="/"
                                        className={ classNames(
                                             'social-list-item',
                                             'border-' + item.variant,
                                             'text-' + item.variant
                                        ) }
                                   >
                                        <FeatherIcon icon={ item.icon } />
                                   </Link>
                              </li>
                         );
                    } ) }
               </ul>
          </React.Fragment>
     )
}

export default SocialLinks