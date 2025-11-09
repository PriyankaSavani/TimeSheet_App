import classNames from 'classnames';
import FeatherIcon from 'feather-icons-react';
import React, { useState } from 'react'
import { Button, Modal, Form } from 'react-bootstrap'

interface UsersAddActionProps {
     addUser: ( user: { fullname: string; email: string; role: string; password: string } ) => void;
}

const UsersAddAction: React.FC<UsersAddActionProps> = ( { addUser } ) => {
     const [ showModal, setShowModal ] = useState( false );
     const [ formData, setFormData ] = useState( { fullname: '', email: '', role: 'user', password: '' } );

     const handleSubmit = () => {
          if ( formData.fullname && formData.email && formData.password ) {
               addUser( formData );
               setFormData( { fullname: '', email: '', role: 'user', password: '' } );
               setShowModal( false );
          }
     };

     return (
          <React.Fragment>
               <Button
                    variant="primary"
                    onClick={ () => setShowModal( true ) }
               >
                    <FeatherIcon
                         icon='user-plus'
                         className={ classNames( 'me-2' ) }
                    />
                    Add User
               </Button>

               <Modal show={ showModal } onHide={ () => setShowModal( false ) }>
                    <Modal.Header closeButton>
                         <Modal.Title>Add New User</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                         <Form>
                              <Form.Group className="mb-3">
                                   <Form.Label>Full Name</Form.Label>
                                   <Form.Control
                                        type="text"
                                        value={ formData.fullname }
                                        onChange={ ( e ) => setFormData( { ...formData, fullname: e.target.value } ) }
                                        placeholder="Enter full name"
                                   />
                              </Form.Group>
                              <Form.Group className="mb-3">
                                   <Form.Label>Email</Form.Label>
                                   <Form.Control
                                        type="email"
                                        value={ formData.email }
                                        onChange={ ( e ) => setFormData( { ...formData, email: e.target.value } ) }
                                        placeholder="Enter email address"
                                   />
                              </Form.Group>
                              <Form.Group className="mb-3">
                                   <Form.Label>Password</Form.Label>
                                   <Form.Control
                                        type="password"
                                        value={ formData.password }
                                        onChange={ ( e ) => setFormData( { ...formData, password: e.target.value } ) }
                                        placeholder="Enter password"
                                   />
                              </Form.Group>
                              <Form.Group className="mb-3">
                                   <Form.Label>Role</Form.Label>
                                   <Form.Select
                                        value={ formData.role }
                                        onChange={ ( e ) => setFormData( { ...formData, role: e.target.value } ) }
                                   >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                   </Form.Select>
                              </Form.Group>
                         </Form>
                    </Modal.Body>
                    <Modal.Footer>
                         <Button variant="secondary" onClick={ () => setShowModal( false ) }>
                              Cancel
                         </Button>
                         <Button
                              variant="primary"
                              onClick={ handleSubmit }
                              disabled={ !formData.fullname || !formData.email || !formData.password }
                         >
                              Add User
                         </Button>
                    </Modal.Footer>
               </Modal>
          </React.Fragment>
     )
}

export default UsersAddAction
