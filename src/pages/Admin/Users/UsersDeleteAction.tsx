import React, { useState } from 'react'
import { Button, Modal } from 'react-bootstrap'

interface User {
     id: string;
     fullname: string;
     email: string;
     role: string;
}

interface UsersDeleteActionProps {
     deleteUser: ( id: string ) => void;
     user: User;
}

const UsersDeleteAction: React.FC<UsersDeleteActionProps> = ( { deleteUser, user } ) => {
     const [ showModal, setShowModal ] = useState( false );

     const handleDelete = () => {
          deleteUser( user.id );
          setShowModal( false );
     };

     return (
          <React.Fragment>
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
                         Are you sure you want to delete this user: { user.fullname }?
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
          </React.Fragment>
     )
}

export default UsersDeleteAction
