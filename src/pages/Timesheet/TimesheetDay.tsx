import React from 'react'
import { Row } from './index'
import FormInput from '../../components/FormInput'

interface TimesheetDayProps {
     row: Row;
     setRows: React.Dispatch<React.SetStateAction<Row[]>>;
     day: string;
     isEditing: boolean;
     editingInputs: Record<number, Record<string, string>>;
     setEditingInputs: React.Dispatch<React.SetStateAction<Record<number, Record<string, string>>>>;
     formatTimeInput: ( input: string ) => string;
     calculateRowTotal: ( times: Record<string, string> ) => string;
}

const TimesheetDay: React.FC<TimesheetDayProps> = ( { row, setRows, day, isEditing, editingInputs, setEditingInputs, formatTimeInput, calculateRowTotal } ) => {
     const time = row.times[ day ] || '';

     // Helper function to normalize time format
     const normalizeTime = ( time: string ) => {
          time = time.replace( /[^0-9]/g, '' ); // remove non-digits
          if ( time.length === 1 ) return `0${ time }:00`;
          if ( time.length === 2 ) return `${ time }:00`;
          if ( time.length === 3 ) return `0${ time[ 0 ] }:${ time.slice( 1 ) }`;
          if ( time.length === 4 ) return `${ time.slice( 0, 2 ) }:${ time.slice( 2 ) }`;
          return '00:00'; // default for empty or invalid
     };

     return (
          <React.Fragment>
               { isEditing ? (
                    <FormInput
                         type="text"
                         name={ day }
                         value={ editingInputs[ row.id ]?.[ day ] || row.times[ day ] || '' }
                         onChange={ ( e ) => {
                              const formatted = formatTimeInput( e.target.value );
                              setEditingInputs( prev => ( { ...prev, [ row.id ]: { ...prev[ row.id ], [ day ]: formatted } } ) );
                              const newTimes = { ...row.times, [ day ]: formatted };
                              const newTotal = calculateRowTotal( newTimes );
                              setRows( prev => prev.map( r => r.id === row.id ? { ...r, times: newTimes, total: newTotal } : r ) );
                         } }
                         placeholder="00:00"
                         className="mb-0"
                    />
               ) : (
                    <span>
                         { normalizeTime( time ) || '00:00' }
                    </span>
               ) }
          </React.Fragment>
     )
}

export default TimesheetDay
