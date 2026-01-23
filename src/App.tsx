import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './redux/store';
import Routes from './routes/Routes';
import { initializeAuth, resetAuth } from './redux/auth/actions';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config/firebase';
import { APICore } from './helpers/api/apiCore';

// theme
import './assets/scss/Default.scss';
import { Spinner } from 'components';

const App = () => {
     const dispatch = useDispatch<AppDispatch>();
     const api = useMemo( () => new APICore(), [] );
     const [ loading, setLoading ] = useState( true );

     useEffect( () => {
          const unsubscribe = onAuthStateChanged( auth, async ( user ) => {
               if ( user ) {
                    // Fetch user data from Firestore
                    const userDoc = await getDoc( doc( db, 'users', user.uid ) );
                    const userData = userDoc.exists() ? userDoc.data() : {};
                    const role = userData.role || 'user';
                    const fullname = userData.fullname || '';

                    // Split fullname into firstName and lastName
                    const nameParts = fullname.split( ' ' );
                    const firstName = nameParts[ 0 ] || '';
                    const lastName = nameParts.slice( 1 ).join( ' ' ) || '';

                    const userInfo = {
                         id: user.uid,
                         username: user.email || '',
                         firstName: firstName,
                         lastName: lastName,
                         role: role,
                         token: await user.getIdToken(),
                    };

                    api.setLoggedInUser( userInfo );
                    dispatch( initializeAuth( userInfo ) );
               } else {
                    // User is signed out
                    api.setLoggedInUser( null );
                    dispatch( resetAuth() );
               }
               setLoading( false );
          } );

          return () => unsubscribe();
     }, [ dispatch, api ] );

     if ( loading ) {
          return <Spinner />;
     }

     return <Routes />;
};

export default App;
