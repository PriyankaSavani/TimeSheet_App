import React, { useState } from 'react'
import { Form } from 'react-bootstrap';

interface TimesheetProjectProps {
     value: string;
     onChange: ( value: string ) => void;
}

const TimesheetProject: React.FC<TimesheetProjectProps> = ( { value, onChange } ) => {
     const [ isEditing, setIsEditing ] = useState( value === 'Select Project' );

     return (
          <React.Fragment>
               { isEditing ? (
                    <Form.Select value={ value } onChange={ ( e ) => { onChange( e.target.value ); setIsEditing( false ); } }>
                         <option>Select Project</option>
                         <option value="PROJECT 1">PROJECT 1</option>
                         <option value="PROJECT 2">PROJECT 2</option>
                         <option value="PROJECT 3">PROJECT 3</option>
                    </Form.Select>
               ) : (
                    <span onClick={ () => setIsEditing( true ) } style={ { cursor: 'pointer' } }>
                         { value }
                    </span>
               ) }
          </React.Fragment>
     )
}

export default TimesheetProject
