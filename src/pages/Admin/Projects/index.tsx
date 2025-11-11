import React, { useState, useEffect } from 'react'
import { Card, Col, Row, Table } from 'react-bootstrap'
import FormInput from '../../../components/FormInput'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../../config/firebase'

// component
import ProjectAddAction from './ProjectAddAction'
import ProjectDeleteAction from './ProjectDeleteAction'
import ProjectEditAction from './ProjectEditAction'
import PageTitle from 'components/PageTitle'
import classNames from 'classnames'

interface User {
     id: string;
     fullname: string;
     email: string;
}

interface Project {
     id: string;
     createdDate: string;
     projectName: string;
     clientName: string;
     assignEmployee: string[];
     task: string[];
     budgetPerHour: number;
     budgetForEmployee: number;
     status: string;
     action: string;
}

const Projects = () => {

     const [ projects, setProjects ] = useState<Project[]>( [] );
     const [ editing, setEditing ] = useState<{ [ key: string ]: 'all' | null }>( {} );
     const [ users, setUsers ] = useState<User[]>( [] );

     useEffect( () => {
          const fetchUsers = async () => {
               try {
                    const usersCollection = collection( db, 'users' );
                    const usersSnapshot = await getDocs( usersCollection );
                    const usersList = usersSnapshot.docs.map( doc => ( {
                         id: doc.id,
                         ...doc.data()
                    } ) as User );
                    setUsers( usersList );
               } catch ( error ) {
                    console.error( 'Error fetching users:', error );
               }
          };

          fetchUsers();

          // Set up real-time listener for projects
          const projectsCollection = collection( db, 'projects' );
          const unsubscribeProjects = onSnapshot( projectsCollection, ( snapshot ) => {
               const projectsList = snapshot.docs.map( doc => ( {
                    id: doc.id,
                    ...doc.data()
               } ) as Project );
               // Sort projects by createdDate in descending order (newest first)
               const sortedProjects = projectsList.sort( ( a, b ) => {
                    const dateA = new Date( a.createdDate );
                    const dateB = new Date( b.createdDate );
                    return dateB.getTime() - dateA.getTime();
               } );
               setProjects( sortedProjects );
          }, ( error ) => {
               console.error( 'Error listening to projects:', error );
          } );

          // Cleanup function to unsubscribe from the listener
          return () => {
               unsubscribeProjects();
          };
     }, [] );

     const addProject = async ( project: Omit<Project, 'id' | 'createdDate'> ) => {
          try {
               const newProject = {
                    createdDate: new Date().toLocaleDateString( 'en-US' ),
                    ...project,
               };
               await addDoc( collection( db, 'projects' ), newProject );
               // No need to manually update state, the listener will handle it
          } catch ( error ) {
               console.error( 'Error adding project:', error );
          }
     };

     const startEditingAll = ( id: string ) => {
          setEditing( prev => ( { ...prev, [ id ]: 'all' } ) );
     };

     const stopEditing = ( id: string ) => {
          setEditing( prev => ( { ...prev, [ id ]: null } ) );
     };

     const deleteProject = async ( id: string ) => {
          try {
               // Get the project name before deleting
               const projectToDelete = projects.find( p => p.id === id );
               if ( !projectToDelete ) return;

               const projectName = projectToDelete.projectName;

               // Fetch all timesheets and remove rows for this project
               const timesheetsCollection = collection( db, 'timesheets' );
               const timesheetsSnapshot = await getDocs( timesheetsCollection );
               const updatePromises = timesheetsSnapshot.docs.map( async ( timesheetDoc ) => {
                    const timesheetData = timesheetDoc.data();
                    const rows = timesheetData.rows || [];
                    const filteredRows = rows.filter( ( row: any ) => row.project !== projectName );
                    if ( filteredRows.length !== rows.length ) {
                         await updateDoc( timesheetDoc.ref, { rows: filteredRows } );
                    }
               } );
               await Promise.all( updatePromises );

               // Delete the project
               await deleteDoc( doc( db, 'projects', id ) );
               // No need to manually update state, the listener will handle it
          } catch ( error ) {
               console.error( 'Error deleting project:', error );
          }
     };

     const updateProject = async ( id: string, updatedProject: Partial<Project> ) => {
          try {
               await updateDoc( doc( db, 'projects', id ), updatedProject );
               // No need to manually update state, the listener will handle it
          } catch ( error ) {
               console.error( 'Error updating project:', error );
          }
     };

     return (
          <React.Fragment>
               <PageTitle title={ 'Projects' } />
               <Row>
                    <Col>
                         <Card>
                              <Card.Body>
                                   <div className={ classNames( 'd-flex justify-content-end mb-3' ) }>
                                        <ProjectAddAction addProject={ addProject } />
                                   </div>
                                   <Table
                                        bordered
                                        responsive
                                        hover
                                        variant='warning'
                                        className={ classNames( 'mb-0' ) }
                                   >
                                        <thead>
                                             <tr>
                                                  <th>CREATED DATE</th>
                                                  <th>PROJECT NAME</th>
                                                  <th>CLIENT NAME</th>
                                                  <th>ASSIGN EMPLOYEE</th>
                                                  <th>TASK</th>
                                                  <th>BUDGET (PER HOUR)</th>
                                                  <th>BUDGET FOR EMPLOYEE (PER HOUR)</th>
                                                  <th>STATUS</th>
                                                  <th>ACTION</th>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             { projects.length === 0 ? (
                                                  <tr>
                                                       <td colSpan={ 9 } className={ classNames( 'text-center' ) }>
                                                            No projects added yet.
                                                       </td>
                                                  </tr>
                                             ) : (
                                                  projects.map( project => (
                                                       <tr key={ project.id }>
                                                            <td>
                                                                 { editing[ project.id ] === 'all' ? (
                                                                      <FormInput
                                                                           type="text"
                                                                           name={ `createdDate-${ project.id }` }
                                                                           value={ project.createdDate }
                                                                           onChange={ ( e ) => {
                                                                                updateProject(
                                                                                     project.id,
                                                                                     { createdDate: e.target.value }
                                                                                );
                                                                           } }
                                                                      />
                                                                 ) : (
                                                                      project.createdDate
                                                                 ) }
                                                            </td>
                                                            <td>
                                                                 { editing[ project.id ] === 'all' ? (
                                                                      <FormInput
                                                                           type="text"
                                                                           name={ `projectName-${ project.id }` }
                                                                           value={ project.projectName }
                                                                           onChange={ ( e ) => {
                                                                                updateProject(
                                                                                     project.id,
                                                                                     { projectName: e.target.value }
                                                                                );
                                                                           } }
                                                                      />
                                                                 ) : (
                                                                      project.projectName
                                                                 ) }
                                                            </td>
                                                            <td>
                                                                 { editing[ project.id ] === 'all' ? (
                                                                      <FormInput
                                                                           type="text"
                                                                           name={ `clientName-${ project.id }` }
                                                                           value={ project.clientName }
                                                                           onChange={ ( e ) => {
                                                                                updateProject(
                                                                                     project.id,
                                                                                     { clientName: e.target.value }
                                                                                );
                                                                           } }
                                                                      />
                                                                 ) : (
                                                                      project.clientName
                                                                 ) }
                                                            </td>
                                                            <td>
                                                                 { editing[ project.id ] === 'all' ? (
                                                                      <div>
                                                                           { users.map( user => (
                                                                                <div className={ classNames( 'form-check' ) }>
                                                                                     <input
                                                                                          className={ classNames( 'form-check-input' ) }
                                                                                          type="checkbox"
                                                                                          id={ `edit-assign-${ project.id }-${ user.id }` }
                                                                                          checked={ project.assignEmployee.includes( user.fullname ) }
                                                                                          onChange={ ( e ) => {
                                                                                               const updatedEmployees = e.target.checked
                                                                                                    ? [ ...project.assignEmployee, user.fullname ]
                                                                                                    : project.assignEmployee.filter( emp => emp !== user.fullname );
                                                                                               updateProject(
                                                                                                    project.id,
                                                                                                    { assignEmployee: updatedEmployees }
                                                                                               );
                                                                                          } }
                                                                                     />
                                                                                     <label
                                                                                          className={ classNames( 'form-check-label' ) }
                                                                                          htmlFor={ `edit-assign-${ project.id }-${ user.id }` }
                                                                                     >
                                                                                          { user.fullname }
                                                                                     </label>
                                                                                </div>
                                                                           ) ) }
                                                                      </div>
                                                                 ) : (
                                                                      project.assignEmployee && Array.isArray( project.assignEmployee ) ? project.assignEmployee.join( ', ' ) : ''
                                                                 ) }
                                                            </td>
                                                            <td>
                                                                 { editing[ project.id ] === 'all' ? (
                                                                      <div>
                                                                           { [ 'General', 'Mechanical', 'Electrical', 'Plumbing' ].map( task => (
                                                                                <div className={ classNames( 'form-check' ) }>
                                                                                     <input
                                                                                          className={ classNames( 'form-check-input' ) }
                                                                                          type="checkbox"
                                                                                          id={ `edit-task-${ project.id }-${ task }` }
                                                                                          checked={ project.task.includes( task ) }
                                                                                          onChange={ ( e ) => {
                                                                                               const updatedTasks = e.target.checked
                                                                                                    ? [ ...project.task, task ]
                                                                                                    : project.task.filter( t => t !== task );
                                                                                               updateProject(
                                                                                                    project.id,
                                                                                                    { task: updatedTasks }
                                                                                               );
                                                                                          } }
                                                                                     />
                                                                                     <label
                                                                                          className={ classNames( 'form-check-label' ) }
                                                                                          htmlFor={ `edit-task-${ project.id }-${ task }` }
                                                                                     >
                                                                                          { task }
                                                                                     </label>
                                                                                </div>
                                                                           ) ) }
                                                                      </div>
                                                                 ) : (
                                                                      project.task && Array.isArray( project.task ) ? project.task.join( ', ' ) : ''
                                                                 ) }
                                                            </td>
                                                            <td>
                                                                 { editing[ project.id ] === 'all' ? (
                                                                      <FormInput
                                                                           type="text"
                                                                           name={ `budgetPerHour-${ project.id }` }
                                                                           value={ project.budgetPerHour.toString() }
                                                                           onChange={ ( e ) => {
                                                                                updateProject(
                                                                                     project.id,
                                                                                     { budgetPerHour: parseFloat( e.target.value ) || 0 }
                                                                                );
                                                                           } }
                                                                      />
                                                                 ) : (
                                                                      project.budgetPerHour.toString()
                                                                 ) }
                                                            </td>
                                                            <td>
                                                                 { editing[ project.id ] === 'all' ? (
                                                                      <FormInput
                                                                           type="text"
                                                                           name={ `budgetForEmployee-${ project.id }` }
                                                                           value={ project.budgetForEmployee.toString() }
                                                                           onChange={ ( e ) => {
                                                                                updateProject(
                                                                                     project.id,
                                                                                     { budgetForEmployee: parseFloat( e.target.value ) || 0 }
                                                                                );
                                                                           } }
                                                                      />
                                                                 ) : (
                                                                      project.budgetForEmployee.toString()
                                                                 ) }
                                                            </td>
                                                            <td>
                                                                 { editing[ project.id ] === 'all' ? (
                                                                      <select
                                                                           className={ classNames( 'form-select' ) }
                                                                           name={ `status-${ project.id }` }
                                                                           value={ project.status }
                                                                           onChange={ ( e ) => {
                                                                                updateProject(
                                                                                     project.id,
                                                                                     { status: e.target.value }
                                                                                );
                                                                           } }
                                                                      >
                                                                           <option value="Active">Active</option>
                                                                           <option value="On Hold">On Hold</option>
                                                                           <option value="Completed">Completed</option>
                                                                      </select>
                                                                 ) : (
                                                                      project.status
                                                                 ) }
                                                            </td>
                                                            <td>
                                                                 <div className={ classNames( 'd-flex' ) }>
                                                                      <ProjectEditAction
                                                                           onEdit={ () => {
                                                                                if ( editing[ project.id ] === 'all' ) {
                                                                                     stopEditing( project.id );
                                                                                } else {
                                                                                     startEditingAll( project.id );
                                                                                }
                                                                           } }
                                                                           isEditing={ editing[ project.id ] === 'all' }
                                                                      />
                                                                      <ProjectDeleteAction
                                                                           deleteProject={ deleteProject }
                                                                           projectId={ project.id }
                                                                      />
                                                                 </div>
                                                            </td>
                                                       </tr>
                                                  ) )
                                             ) }
                                        </tbody>
                                   </Table>
                              </Card.Body>
                         </Card>
                    </Col>
               </Row>
          </React.Fragment>
     )
}

export default Projects
