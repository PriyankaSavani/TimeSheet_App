import React from 'react'
import { Button } from 'react-bootstrap'

interface TimesheetEditActionProps {
     onEdit: () => void;
     isEditing: boolean;
}

const TimesheetEditAction: React.FC<TimesheetEditActionProps> = ( { onEdit, isEditing } ) => {
     return (
          <Button
               variant={ isEditing ? 'success' : 'primary' }
               size="sm"
               onClick={ onEdit }
               className="me-2"
          >
               { isEditing ? 'Save' : 'Edit' }
          </Button>
     )
}

export default TimesheetEditAction
