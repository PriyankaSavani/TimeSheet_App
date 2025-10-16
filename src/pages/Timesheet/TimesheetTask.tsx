import React from 'react'
import { Form } from 'react-bootstrap'

interface TimesheetTaskProps {
     rowId: number;
     value: string;
     isEditing: boolean;
     editingInputs: Record<number, Record<string, string>>;
     setEditingInputs: React.Dispatch<React.SetStateAction<Record<number, Record<string, string>>>>;
     updateTask: ( id: number, task: string ) => void;
}

const TimesheetTask: React.FC<TimesheetTaskProps> = ( { rowId, value, isEditing, editingInputs, setEditingInputs, updateTask } ) => {
     const handleKeyDown = ( e: React.KeyboardEvent<HTMLInputElement> ) => {
          if ( e.key === 'Enter' || e.key === 'Tab' ) {
               // Logic can be added here if needed for saving on key press
          }
     };

     return (
          <React.Fragment>
               { isEditing ? (
                    <Form.Control
                         type="text"
                         placeholder="Enter task"
                         value={ editingInputs[ rowId ]?.task || value }
                         onChange={ ( e ) => {
                              const val = e.target.value;
                              setEditingInputs( prev => ( { ...prev, [ rowId ]: { ...prev[ rowId ], task: val } } ) );
                              updateTask( rowId, val );
                         } }
                         onKeyDown={ handleKeyDown }
                         autoFocus
                    />
               ) : (
                    <span onClick={ () => updateTask( rowId, value ) }>
                         { value || 'Add task' }
                    </span>
               ) }
          </React.Fragment>
     )
}

export default TimesheetTask
