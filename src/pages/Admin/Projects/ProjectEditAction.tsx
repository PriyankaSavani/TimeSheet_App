import React from 'react'
import { Button } from 'react-bootstrap'

interface ProjectEditActionProps {
     onEdit: () => void;
     isEditing: boolean;
}

const ProjectEditAction: React.FC<ProjectEditActionProps> = ( { onEdit, isEditing } ) => {
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

export default ProjectEditAction
