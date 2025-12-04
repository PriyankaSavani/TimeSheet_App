import React, { useState } from 'react'
import { Row } from './index'
import { Modal, Button, Form } from 'react-bootstrap'
import FeatherIcon from 'feather-icons-react'
import FormInput from 'components/FormInput';

interface TimesheetDayProps {
     row: Row;
     setRows: React.Dispatch<React.SetStateAction<Row[]>>;
     day: string;
     isEditing: boolean;
     editingInputs: Record<string, Record<string, string>>;
     setEditingInputs: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>;
     formatTimeInput: ( input: string ) => string;
     calculateRowTotal: ( times: Record<string, { time: string, description: string }> ) => string;
}

const TimesheetDay: React.FC<TimesheetDayProps> = ( { row, setRows, day, isEditing, editingInputs, setEditingInputs, formatTimeInput, calculateRowTotal } ) => {
     const timeData = row.times[ day ];
     const time = timeData?.time || '';
     const [ showModal, setShowModal ] = useState( false )
     const [ notes, setNotes ] = useState( timeData?.description || '' )
     const [ modalTime, setModalTime ] = useState( time )
     const [ rawDigits, setRawDigits ] = useState( '' )
     const inputRef = React.useRef<HTMLInputElement>( null );


     // Function to format input as user types
     const formatInputAsTyped = ( digits: string ) => {
          if ( digits.length === 0 ) return '00:00';
          if ( digits.length === 1 ) return `00:0${ digits }`;
          if ( digits.length === 2 ) return `00:${ digits }`;
          if ( digits.length === 3 ) return `0${ digits[ 0 ] }:${ digits.slice( 1 ) }`;
          if ( digits.length === 4 ) return `${ digits.slice( 0, 2 ) }:${ digits.slice( 2 ) }`;
          return `${ digits.slice( 0, 2 ) }:${ digits.slice( 2, 4 ) }`; // limit to 4 digits
     };

     const inputValue = formatInputAsTyped( rawDigits )

     // Helper function to normalize time format
     const normalizeTime = ( time: string ) => {
          time = time.replace( /[^0-9]/g, '' ); // remove non-digits
          if ( time.length === 1 ) return `0${ time }:00`;
          if ( time.length === 2 ) return `${ time }:00`;
          if ( time.length === 3 ) return `0${ time[ 0 ] }:${ time.slice( 1 ) }`;
          if ( time.length === 4 ) return `${ time.slice( 0, 2 ) }:${ time.slice( 2 ) }`;
          return '00:00'; // default for empty or invalid
     };

     const hasTime = time && time !== '00:00' && time !== ''

     const handleSaveNotes = () => {
          // Update the time in the table
          const newTimes = { ...row.times, [ day ]: { time: modalTime, description: notes } };
          const newTotal = calculateRowTotal( newTimes );
          setRows( prev => prev.map( r => r.id === row.id ? { ...r, times: newTimes, total: newTotal } : r ) );
          setShowModal( false );
     }

     return (
          <React.Fragment>
               { hasTime ? (
                    <div className="d-flex align-items-center justify-content-between">
                         <span onClick={ () => {
                              const digits = time.replace( /[^0-9]/g, '' );
                              setRawDigits( digits );
                              // Switch to input mode by clearing the time
                              const newTimes = { ...row.times, [ day ]: { time: '', description: '' } };
                              setRows( prev => prev.map( r => r.id === row.id ? { ...r, times: newTimes, total: calculateRowTotal( newTimes ) } : r ) );
                         } }>
                              { normalizeTime( time ) }
                         </span>
                         <button
                              className="btn btn-link p-0 text-dark"
                              onClick={ () => {
                                   setModalTime( time );
                                   setShowModal( true );
                              } }
                              style={ { boxShadow: 'none' } }
                         >
                              <FeatherIcon icon="more-vertical" size={ 14 } />
                         </button>
                    </div>
               ) : (
                    <FormInput
                         type="text"
                         name={ `time-${ day.replace( /[^a-zA-Z0-9]/g, '-' ) }` }
                         value={ inputValue }
                         onChange={ () => { } } // Prevent direct changes, handle via keydown
                         onKeyDown={ ( e ) => {
                              if ( e.key >= '0' && e.key <= '9' ) {
                                   e.preventDefault();
                                   if ( rawDigits.length < 4 ) {
                                        setRawDigits( prev => prev + e.key );
                                   }
                              } else if ( e.key === 'Backspace' ) {
                                   e.preventDefault();
                                   setRawDigits( prev => prev.slice( 0, -1 ) );
                              } else if ( e.key === 'Enter' || e.key === 'Tab' ) {
                                   const formatted = formatTimeInput( inputValue );
                                   const newTimes = { ...row.times, [ day ]: { time: formatted, description: '' } };
                                   const newTotal = calculateRowTotal( newTimes );
                                   setRows( prev => prev.map( r => r.id === row.id ? { ...r, times: newTimes, total: newTotal } : r ) );
                              }
                         } }
                         placeholder="00:00"
                         className="mb-0"
                         refCallback={ ( el: HTMLInputElement ) => { inputRef.current = el; } }
                    />
               ) }

               <Modal show={ showModal } onHide={ () => setShowModal( false ) }>
                    <Modal.Header closeButton>
                         <Modal.Title>Edit Time</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                         <div>{ day }</div>
                         <div className="mb-3">
                              <strong>Task:</strong> { row.task || 'No task selected' }
                         </div>
                         <hr />
                         <Form.Group className="mb-3">
                              <Form.Label>Time</Form.Label>
                              <Form.Control
                                   type="text"
                                   value={ modalTime }
                                   onChange={ ( e ) => setModalTime( formatTimeInput( e.target.value ) ) }
                                   placeholder="00:00"
                              />
                         </Form.Group>
                         <hr />
                         <Form.Group className="mb-3">
                              <Form.Label>Description</Form.Label>
                              <Form.Control
                                   as="textarea"
                                   rows={ 2 }
                                   value={ notes }
                                   onChange={ ( e ) => setNotes( e.target.value ) }
                                   placeholder="What have you worked on?"
                              />
                         </Form.Group>
                         <Form.Group className="mb-3">
                              <Form.Label>Tags</Form.Label>
                              <Form.Select
                                   value={ notes }
                                   onChange={ ( e ) => setNotes( e.target.value ) }
                              >
                                   <option value="">Select Tag</option>
                                   <option value="Development">Development</option>
                                   <option value="Meeting">Meeting</option>
                                   <option value="Testing">Testing</option>
                                   <option value="Documentation">Documentation</option>
                                   <option value="Support">Support</option>
                                   <option value="Other">Other</option>
                              </Form.Select>
                         </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                         <Button variant="secondary" onClick={ () => setShowModal( false ) }>
                              Cancel
                         </Button>
                         <Button variant="primary" onClick={ handleSaveNotes }>
                              Save
                         </Button>
                    </Modal.Footer>
               </Modal>
          </React.Fragment>
     )
}

export default TimesheetDay
