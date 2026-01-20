import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import FeatherIcon from 'feather-icons-react';
import { useTimesheetCalculations } from '../hooks/useTimesheetCalculations';

interface WeekNavigationProps {
     weekOffset: number;
     setWeekOffset: ( offset: number | ( ( prev: number ) => number ) ) => void;
     localStorageKey: string;
     className?: string;
}

const WeekNavigation: React.FC<WeekNavigationProps> = ( {
     weekOffset,
     setWeekOffset,
     localStorageKey,
     className = ''
} ) => {
     // Save weekOffset to localStorage whenever it changes
     useEffect( () => {
          localStorage.setItem( localStorageKey, weekOffset.toString() );
     }, [ weekOffset, localStorageKey ] );

     const { weekDisplay } = useTimesheetCalculations( weekOffset, [] );

     return (
          <div className={ `d-flex ${ className }` }>
               <Button
                    variant="primary"
                    size='sm'
                    onClick={ () => setWeekOffset( prev => prev - 1 ) }
               >
                    <FeatherIcon icon='arrow-left-circle' className='me-2' />
                    Previous
               </Button>
               <div className="border rounded align-self-center mx-3 p-1">
                    { weekDisplay }
               </div>
               <Button
                    variant="primary"
                    size='sm'
                    onClick={ () => setWeekOffset( prev => prev + 1 ) }
                    disabled={ weekOffset === 0 }
               >
                    Next
                    <FeatherIcon icon='arrow-right-circle' className='ms-2' />
               </Button>
          </div>
     );
};

export default WeekNavigation;
