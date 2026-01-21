import React, { useEffect } from 'react';
import { Button } from 'react-bootstrap';
import FeatherIcon from 'feather-icons-react';

interface MonthNavigationProps {
     monthOffset: number;
     setMonthOffset: ( offset: number | ( ( prev: number ) => number ) ) => void;
     localStorageKey: string;
     className?: string;
}

const MonthNavigation: React.FC<MonthNavigationProps> = ( {
     monthOffset,
     setMonthOffset,
     localStorageKey,
     className = ''
} ) => {
     // Save monthOffset to localStorage whenever it changes
     useEffect( () => {
          localStorage.setItem( localStorageKey, monthOffset.toString() );
     }, [ monthOffset, localStorageKey ] );

     // Calculate month display
     const monthDisplay = React.useMemo( () => {
          const today = new Date();
          const targetDate = new Date( today.getFullYear(), today.getMonth() + monthOffset, 1 );
          const monthName = targetDate.toLocaleDateString( 'en-US', { month: 'long' } );
          const year = targetDate.getFullYear();
          const prefix = monthOffset === 0 ? 'This month' : 'Month of';
          return `${ prefix } : ${ monthName } ${ year }`;
     }, [ monthOffset ] );

     return (
          <div className={ `d-flex ${ className }` }>
               <Button
                    variant="primary"
                    size='sm'
                    onClick={ () => setMonthOffset( prev => prev - 1 ) }
               >
                    <FeatherIcon icon='arrow-left-circle' className='me-2' />
                    Previous
               </Button>
               <div className="border rounded align-self-center mx-3 p-1">
                    { monthDisplay }
               </div>
               <Button
                    variant="primary"
                    size='sm'
                    onClick={ () => setMonthOffset( prev => prev + 1 ) }
                    disabled={ monthOffset === 0 }
               >
                    Next
                    <FeatherIcon icon='arrow-right-circle' className='ms-2' />
               </Button>
          </div>
     );
};

export default MonthNavigation;
