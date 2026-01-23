import React, { useEffect, useState } from 'react'
import { CirclesWithBar } from 'react-loader-spinner';
import { useLocation } from 'react-router-dom';
import { COLORS } from '../constants';

const Spinner = () => {

     const [ isLoading, setIsLoading ] = useState( false );
     const location = useLocation();

     useEffect( () => {
          console.log( 'Route changed to:', location.pathname );
          setIsLoading( true );

          // Simulate loading time or wait for actual data loading
          const timer = setTimeout( () => {
               setIsLoading( false );
               console.log( 'Loading finished for:', location.pathname );
          }, 300 );

          return () => clearTimeout( timer );
     }, [ location.pathname ] );

     if ( !isLoading ) return null;

     return (
          <React.Fragment>
               <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-black opacity-50"
                    style={ { zIndex: 10000 } }
               >
                    <CirclesWithBar
                         height="100"
                         width="100"
                         color={ COLORS.PRIMARY }
                         outerCircleColor={ COLORS.PRIMARY }
                         innerCircleColor={ COLORS.PRIMARY }
                         barColor={ COLORS.PRIMARY }
                         ariaLabel="circles-with-bar-loading"
                         wrapperStyle={ {} }
                         wrapperClass=""
                         visible={ true }
                    />
               </div>
          </React.Fragment>
     )
}

export default Spinner