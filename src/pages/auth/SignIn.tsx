import React, { useEffect } from 'react';
import { Button, Alert, Row, Col } from 'react-bootstrap';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslation } from 'react-i18next';

// actions
import { resetAuth, signinUser } from '../../redux/actions';

// store
import { AppDispatch } from '../../redux/store';

// selectors
import { selectAuthState } from '../../redux/auth/selectors';

// components
import { VerticalForm, FormInput } from '../../components';
import SocialLinks from '../../components/SocialLinks';

import AuthLayout from './AuthLayout';

interface LocationState {
     from?: Location;
}

interface UserData {
     username: string;
     password: string;
}

/* bottom links */
const BottomLink = () => {
     const { t } = useTranslation();

     return (
          <Row className="mt-3">
               <Col className="text-center">
                    <p>
                         <Link to={ '/auth/forget-password' } className="ms-1">
                              { t( 'Forgot your password?' ) }
                         </Link>
                    </p>
                    <p className="">
                         { t( "Don't have an account?" ) }{ ' ' }
                         <Link to={ '/auth/signUp' } className="ms-1">
                              <b>{ t( 'Sign Up' ) }</b>
                         </Link>
                    </p>
               </Col>
          </Row>
     );
};

const SignIn = () => {
     const { t } = useTranslation();
     const dispatch = useDispatch<AppDispatch>();

     const { user, userLoggedIn, loading, error } = useSelector( selectAuthState );

     useEffect( () => {
          dispatch( resetAuth() );
     }, [ dispatch ] );

     /*
     form validation schema
     */
     const schemaResolver = yupResolver(
          yup.object().shape( {
               username: yup.string().email( t( 'Please enter a valid email' ) ).required( t( 'Please enter Email' ) ),
               password: yup.string().required( t( 'Please enter Password' ) ),
          } )
     );

     /*
     handle form submission
     */
     const onSubmit = ( formData: UserData ) => {
          dispatch( signinUser( formData[ 'username' ], formData[ 'password' ] ) );
     };

     const location = useLocation();
     const state = location.state as LocationState;
     const redirectUrl = state && state.from ? state.from.pathname : '/';

     return (
          <>
               { ( userLoggedIn || user ) && <Navigate to={ redirectUrl } /> }

               <AuthLayout
                    helpText={ t( 'Enter your email address and password to access Timesheet.' ) }
                    bottomLinks={ <BottomLink /> }
               >
                    { error && (
                         <Alert variant="danger" className="my-2">
                              { error }
                         </Alert>
                    ) }

                    <VerticalForm
                         onSubmit={ onSubmit }
                         resolver={ schemaResolver }
                         defaultValues={ { username: '', password: '' } }
                    >
                         <FormInput
                              label={ t( 'Email' ) }
                              type="email"
                              name="username"
                              placeholder="Enter your Email"
                              containerClass={ 'mb-3' }
                         />
                         <FormInput
                              label={ t( 'Password' ) }
                              type="password"
                              name="password"
                              placeholder="Enter your password"
                              containerClass={ 'mb-3' }
                         />

                         <div className="text-center d-grid">
                              <Button variant="primary" type="submit" disabled={ loading }>
                                   { t( 'Sign In' ) }
                              </Button>
                         </div>
                    </VerticalForm>

                    <div className="text-center">
                         <h5 className="mt-3 text-muted">{ t( 'Sign in with' ) }</h5>
                         <SocialLinks />
                    </div>
               </AuthLayout>
          </>
     );
};

export default SignIn;
