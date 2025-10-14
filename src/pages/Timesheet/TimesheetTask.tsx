import React, { useState } from 'react'
import { Form } from 'react-bootstrap'

interface TimesheetTaskProps {
     value: string;
     onChange: ( value: string ) => void;
}

const TimesheetTask: React.FC<TimesheetTaskProps> = ( { value, onChange } ) => {
     const [ isEditing, setIsEditing ] = useState( !value );

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
                         placeholder="Enter task"
                         value={ value }
                         onChange={ ( e ) => onChange( e.target.value ) }
                         onKeyDown={ handleKeyDown }
                         autoFocus
                    />
               ) : (
                    <span onClick={ () => setIsEditing( true ) } style={ { cursor: 'pointer' } }>
                         { value || 'Click to add task' }
                    </span>
               ) }
          </React.Fragment>
     )
}

export default TimesheetTask
