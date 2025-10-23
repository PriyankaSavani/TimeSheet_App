import React, { useState } from 'react'
import { Button, Modal } from 'react-bootstrap'

interface ProjectDeleteActionProps {
     deleteProject: ( id: string ) => void;
     projectId: string;
}

const ProjectDeleteAction: React.FC<ProjectDeleteActionProps> = ( { deleteProject, projectId } ) => {
     const [ showModal, setShowModal ] = useState( false );

     const handleDelete = () => {
          deleteProject( projectId );
          setShowModal( false );
     };

     return (
          <>
               <Button
                    variant="danger"
                    size="sm"
                    onClick={ () => setShowModal( true ) }
               >
                    Delete
               </Button>
               <Modal show={ showModal } onHide={ () => setShowModal( false ) }>
                    <Modal.Header closeButton>
                         <Modal.Title>Confirm Delete</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                         Are you sure you want to delete this project?
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

export default ProjectDeleteAction
