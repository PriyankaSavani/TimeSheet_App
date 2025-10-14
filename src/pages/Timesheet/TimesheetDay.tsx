import React, { useState } from 'react'
import { Form } from 'react-bootstrap'
import { Row } from './index'

interface TimesheetDayProps {
     row: Row;
     setRows: React.Dispatch<React.SetStateAction<Row[]>>;
     day: string;
}

const TimesheetDay: React.FC<TimesheetDayProps> = ( { row, setRows, day } ) => {
     const time = row.times[ day ] || '';
     const [ isEditing, setIsEditing ] = useState( !time )

     // Helper function to normalize time format
     const normalizeTime = ( time: string ) => {
          if ( !time ) return '';
          let hours = 0, minutes = 0;
          if ( time.includes( ':' ) ) {
               [ hours, minutes ] = time.split( ':' ).map( Number );
          } else if ( time.length === 4 ) {
               hours = Number( time.slice( 0, 2 ) );
               minutes = Number( time.slice( 2 ) );
          } else if ( time.length === 3 ) {
               hours = Number( time[ 0 ] );
               minutes = Number( time.slice( 1 ) );
          }
          return `${ hours.toString().padStart( 2, '0' ) }:${ minutes.toString().padStart( 2, '0' ) }`;
     };

     // Calculate total for a row
     const calculateTotal = ( times: Record<string, string> ) => {
          let totalMinutes = 0;
          Object.values( times ).forEach( time => {
               const normalized = normalizeTime( time );
               if ( normalized && normalized.includes( ':' ) ) {
                    const [ hours, minutes ] = normalized.split( ':' ).map( Number );
                    if ( !isNaN( hours ) && !isNaN( minutes ) ) {
                         totalMinutes += hours * 60 + minutes;
                    }
               }
          } );
          const totalHours = Math.floor( totalMinutes / 60 );
          const totalMins = totalMinutes % 60;
          return `${ totalHours.toString().padStart( 2, '0' ) }:${ totalMins.toString().padStart( 2, '0' ) }`;
     };

     const handleChange = ( e: React.ChangeEvent<HTMLInputElement> ) => {
          const newTime = e.target.value;
          const newTimes = { ...row.times, [ day ]: newTime };
          const newTotal = calculateTotal( newTimes );
          const updatedRow = { ...row, times: newTimes, total: newTotal };
          setRows( prev => prev.map( r => r.id === row.id ? updatedRow : r ) );
     };

     const handleKeyDown = ( e: React.KeyboardEvent<HTMLInputElement> ) => {
          if ( e.key === 'Enter' || e.key === 'Tab' ) {
               setIsEditing( false );
          }
     };

     return (
          <React.Fragment>
               { isEditing ? (
                    <Form.Control
                         type="text"
                         placeholder="HH:MM"
                         value={ time }
                         onChange={ handleChange }
                         onKeyDown={ handleKeyDown }
                         autoFocus
                    />
               ) : (
                    <span onClick={ () => setIsEditing( true ) } style={ { cursor: 'pointer' } }>
                         { normalizeTime( time ) || '00:00' }
                    </span>
               ) }
          </React.Fragment>
     )
}

export default TimesheetDay
