import FeatherIcon from 'feather-icons-react'
import React from 'react'
import { Button } from 'react-bootstrap'
import { Row } from './index'

interface TimesheetDeleteActionProps {
     rowId: number;
     onDelete: ( id: number, rows: Row[], setRows: React.Dispatch<React.SetStateAction<Row[]>> ) => void;
     rows: Row[];
     setRows: React.Dispatch<React.SetStateAction<Row[]>>;
}

const TimesheetDeleteAction: React.FC<TimesheetDeleteActionProps> = ( { rowId, onDelete, rows, setRows } ) => {

     const handleDelete = () => {
          const newRows = rows.filter( r => r.id !== rowId );
          if ( newRows.length === 0 ) {
               newRows.push( { id: Date.now(), project: 'Select Project', task: '', times: {}, total: '00:00' } );
          }
          setRows( newRows );
     };

     return (
          <React.Fragment>
               <Button
                    variant='danger'
                    size='sm'
                    onClick={ () => handleDelete() }
               >
                    <FeatherIcon icon="trash-2" />
               </Button>
          </React.Fragment>
     )
}

export default TimesheetDeleteAction
