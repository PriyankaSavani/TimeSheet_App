import React, { useState, useEffect, useRef } from 'react'
import { Button, Modal } from 'react-bootstrap'
import VerticalForm from '../../../components/VerticalForm'
import FormInput from '../../../components/FormInput'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import classNames from 'classnames'
import FeatherIcon from 'feather-icons-react'
import { useFormContext } from 'react-hook-form'

interface User {
     id: string;
     fullname: string;
     email: string;
}

interface ProjectAddActionProps {
     addProject: ( project: {
          projectName: string;
          clientName: string;
          assignEmployee: string[];
          task: string[];
          budgetPerHour: number;
          budgetForEmployee: number;
          status: string;
          action: string;
     } ) => void;
}

const AssignEmployeeCheckboxes: React.FC<{ users: User[] }> = ( { users } ) => {
     const { register } = useFormContext();
     return (
          <div className={ classNames( 'mb-3' ) }>
               <label className="form-label">Assign Employee</label>
               <div className="row">
                    { users.map( ( user, index ) => (
                         <div key={ user.id } className="col-4">
                              <div className="form-check">
                                   <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={ `assign-${ user.id }` }
                                        value={ user.fullname }
                                        { ...register( 'assignEmployee' ) }
                                   />
                                   <label className="form-check-label" htmlFor={ `assign-${ user.id }` }>
                                        { user.fullname }
                                   </label>
                              </div>
                         </div>
                    ) ) }
               </div>
          </div>
     );
};

const TaskCheckboxes: React.FC = () => {
     const { register } = useFormContext();
     const tasks = [ 'General', 'Mechanical', 'Electrical', 'Plumbing' ];
     return (
          <div className={ classNames( 'mb-3' ) }>
               <label className="form-label">Task</label>
               <div className="row">
                    { tasks.map( ( task, index ) => (
                         <div key={ task } className="col-3">
                              <div className="form-check">
                                   <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={ `task-${ task }` }
                                        value={ task }
                                        { ...register( 'task' ) }
                                   />
                                   <label className="form-check-label" htmlFor={ `task-${ task }` }>
                                        { task }
                                   </label>
                              </div>
                         </div>
                    ) ) }
               </div>
          </div>
     );
};

const ProjectAddAction: React.FC<ProjectAddActionProps> = ( { addProject } ) => {

     const [ showModal, setShowModal ] = useState( false );
     const [ users, setUsers ] = useState<User[]>( [] );
     const formRef = useRef<HTMLFormElement>( null );

     useEffect( () => {
          const fetchUsers = async () => {
               try {
                    const q = query( collection( db, 'users' ), where( 'role', 'in', [ 'user', 'admin' ] ) );
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
               assignEmployee: yup.array().of( yup.string().required() ).required().min( 1, 'Please select at least one employee' ),
          } )
     );

     const onSubmit = ( formData: any ) => {
          addProject( {
               projectName: formData.projectName,
               clientName: formData.clientName,
               assignEmployee: formData.assignEmployee,
               task: formData.task || [],
               budgetPerHour: parseFloat( formData.budgetPerHour ) || 0,
               budgetForEmployee: parseFloat( formData.budgetForEmployee ) || 0,
               status: 'active',
               action: '',
          } );
          setShowModal( false );
     };

     return (
          <>
               <Button variant='primary' onClick={ () => setShowModal( true ) }>
                    <FeatherIcon
                         icon='plus-circle'
                         className={ classNames( 'me-2' ) }
                    />
                    Add Project
               </Button>
               <Modal show={ showModal } onHide={ () => setShowModal( false ) }>
                    <Modal.Header closeButton>
                         <Modal.Title>Add Project</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                         <VerticalForm
                              ref={ formRef }
                              onSubmit={ onSubmit }
                              resolver={ schemaResolver }
                              defaultValues={ { projectName: '', clientName: '', assignEmployee: [], task: [] } }
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
                              <AssignEmployeeCheckboxes users={ users } />
                              <TaskCheckboxes />
                         </VerticalForm>
                    </Modal.Body>
                    <Modal.Footer>
                         <Button variant="secondary" onClick={ () => setShowModal( false ) }>
                              Cancel
                         </Button>
                         <Button
                              variant="primary"
                              onClick={ () => formRef.current?.requestSubmit() }
                         >
                              Add Project
                         </Button>
                    </Modal.Footer>
               </Modal>
          </>
     );
};

export default ProjectAddAction
