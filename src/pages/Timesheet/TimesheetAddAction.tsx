import React from 'react';
import { Button } from 'react-bootstrap';
import classNames from 'classnames';
import { Row } from './index';

interface TimesheetAddActionProps {
     rows: Row[];
     setRows: React.Dispatch<React.SetStateAction<Row[]>>;
}

const TimesheetAddAction: React.FC<TimesheetAddActionProps> = ( { rows, setRows } ) => {
     const handleAdd = () => {
          const newRow: Row = { id: Date.now(), project: 'Select Project', task: '', times: {}, total: '00:00' };
          setRows( prev => [ ...prev, newRow ] );
     };

     return (
          <Button
               variant='primary'
               size='sm'
               onClick={ handleAdd }
               className={ classNames( 'me-2' ) }
          >
               Add Data
          </Button>
     );
};

export default TimesheetAddAction;
