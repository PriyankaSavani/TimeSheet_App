import React from 'react';
import { Button } from 'react-bootstrap';
import classNames from 'classnames';
import { Row } from './index';
import FeatherIcon from 'feather-icons-react';

interface TimesheetAddActionProps {
     rows: Row[];
     updateRows?: ( newRows: Row[] ) => Promise<void>;
}

const TimesheetAddAction: React.FC<TimesheetAddActionProps> = ( { rows, updateRows } ) => {
     const handleAdd = async () => {
          const newRow: Row = { id: Date.now().toString(), project: 'Select Project', task: '', times: {}, total: '00:00' };
          const newRows = [ ...rows, newRow ];
          if ( updateRows ) {
               await updateRows( newRows );
          }
     };

     return (
          <Button
               variant='primary'
               size='sm'
               onClick={ handleAdd }
               className={ classNames( 'me-2' ) }
          >
               <FeatherIcon
                    icon='plus-circle'
                    className={ classNames( 'me-2' ) }
               />
               Add Data
          </Button>
     );
};

export default TimesheetAddAction;

