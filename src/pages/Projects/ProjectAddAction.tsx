import React, { useState, useEffect } from 'react'
import { Button, Modal } from 'react-bootstrap'
import VerticalForm from '../../components/VerticalForm'
import FormInput from '../../components/FormInput'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../config/firebase'
import classNames from 'classnames'

interface User {
     id: string;
     fullname: string;
     email: string;
}

interface ProjectAddActionProps {
     addProject: ( project: {
          projectName: string;
          clientName: string;
          assignEmployee: string;
          budgetPerHour: number;
          budgetForEmployee: number;
          status: string;
          action: string;
     } ) => void;
}

const ProjectAddAction: React.FC<ProjectAddActionProps> = ( { addProject } ) => {
     const [ showModal, setShowModal ] = useState( false );
     const [ users, setUsers ] = useState<User[]>( [] );

     useEffect( () => {
          const fetchUsers = async () => {
               try {
                    const q = query( collection( db, 'users' ), where( 'role', '==', 'user' ) );
                    const querySnapshot = await getDocs( q );
                    const userList: User[] = [];
                    querySnapshot.forEach( ( doc ) => {
                         const data = doc.data();
                         userList.push( {
                              id: doc.id,
                              fullname: data.fullname || data.email || '',
                              email: data.email || '',
                         } );
                    } );
                    setUsers( userList );
               } catch ( error ) {
                    console.error( 'Error fetching users:', error );
               }
          };
          fetchUsers();
     }, [] );

     const schemaResolver = yupResolver(
          yup.object().shape( {
               projectName: yup.string().required( 'Please enter project name' ),
               clientName: yup.string().required( 'Please enter client name' ),
               assignEmployee: yup.string().required( 'Please select an employee' ),
          } )
     );

     const onSubmit = ( formData: any ) => {
          addProject( {
               projectName: formData.projectName,
               clientName: formData.clientName,
               assignEmployee: formData.assignEmployee,
               budgetPerHour: parseFloat( formData.budgetPerHour ) || 0,
               budgetForEmployee: parseFloat( formData.budgetForEmployee ) || 0,
               status: 'active',
               action: '',
          } );
          setShowModal( false );
     };

     return (
          <>
               <Button
                    variant='primary'
                    onClick={ () => setShowModal( true ) }
               >
                    Add Project
               </Button>
               <Modal show={ showModal } onHide={ () => setShowModal( false ) }>
                    <Modal.Header closeButton>
                         <Modal.Title>Add Project</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                         <VerticalForm
                              onSubmit={ onSubmit }
                              resolver={ schemaResolver }
                              defaultValues={ { projectName: '', clientName: '', assignEmployee: '' } }
                         >
                              <FormInput
                                   label="Project Name"
                                   type="text"
                                   name="projectName"
                                   placeholder="Enter project name"
                                   className={ classNames( 'mb-3' ) }
                              />
                              <FormInput
                                   label="Client Name"
                                   type="text"
                                   name="clientName"
                                   placeholder="Enter client name"
                                   className={ classNames( 'mb-3' ) }
                              />
                              <FormInput
                                   label="Assign Employee"
                                   type="select"
                                   name="assignEmployee"
                                   className={ classNames( 'mb-3' ) }
                              >
                                   <option value="">Select Employee</option>
                                   { users.map( user => (
                                        <option key={ user.id } value={ user.fullname }>{ user.fullname }</option>
                                   ) ) }
                              </FormInput>
                              <div className="text-end">
                                   <Button type="submit" variant="primary">Add Project</Button>
                              </div>
                         </VerticalForm>
                    </Modal.Body>
               </Modal>
          </>
     )
}

export default ProjectAddAction
