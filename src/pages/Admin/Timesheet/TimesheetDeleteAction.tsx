import React, { useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import { Row } from './index'

interface TimesheetDeleteActionProps {
     rowId: string;
     updateRows?: ( newRows: Row[] ) => Promise<void>;
     rows: Row[];
}

const TimesheetDeleteAction: React.FC<TimesheetDeleteActionProps> = ( { rowId, updateRows, rows } ) => {
     const [ showModal, setShowModal ] = useState( false );

     const handleDelete = async () => {
          const newRows = rows.filter( r => r.id !== rowId );
          const finalRows = newRows.length === 0 ? [ { id: Date.now().toString(), project: 'Select Project', task: '', times: {}, total: '00:00' } ] : newRows;
          if ( updateRows ) {
               await updateRows( finalRows );
          }
          setShowModal( false );
     };

     return (
          <>
               <Button
                    variant='danger'
                    size='sm'
                    onClick={ () => setShowModal( true ) }
               >
                    Delete
               </Button>
               <Modal show={ showModal } onHide={ () => setShowModal( false ) }>
                    <Modal.Header closeButton>
                         <Modal.Title>Confirm Delete</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                         Are you sure you want to delete this timesheet entry?
                    </Modal.Body>
                    <Modal.Footer>
                         <Button variant="secondary" onClick={ () => setShowModal( false ) }>
                              Cancel
                         </Button>
                         <Button variant="danger" onClick={ handleDelete }>
                              Delete
                         </Button>
                    </Modal.Footer>
               </Modal>
          </>
     )
}

export default TimesheetDeleteAction

