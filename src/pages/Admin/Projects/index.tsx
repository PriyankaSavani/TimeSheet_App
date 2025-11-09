import React, { useState, useEffect } from 'react'
import { Card, Col, Row, Table } from 'react-bootstrap'
import FormInput from '../../../components/FormInput'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../../config/firebase'

// component
import ProjectAddAction from './ProjectAddAction'
import ProjectDeleteAction from './ProjectDeleteAction'
import ProjectEditAction from './ProjectEditAction'
import ExportToExcel from '../../../components/ExportToExcel'
import PageTitle from 'components/PageTitle'

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
     assignEmployee: string;
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
                    const dateA = new Date( a.createdDate.split( '/' ).reverse().join( '-' ) );
                    const dateB = new Date( b.createdDate.split( '/' ).reverse().join( '-' ) );
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
                    createdDate: new Date().toLocaleDateString( 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' } ),
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

     // Prepare data for Excel export
     const prepareExportData = () => {
          const data = [];
          // Header row
          const header = [
               'Created Date',
               'Project Name',
               'Client Name',
               'Assign Employee',
               'Budget (Per Hour)',
               'Budget For Employee (Per Hour)',
               'Status'
          ];
          data.push( header );
          // Data rows
          projects.forEach( project => {
               const rowData = [
                    project.createdDate,
                    project.projectName,
                    project.clientName,
                    project.assignEmployee,
                    project.budgetPerHour.toString(),
                    project.budgetForEmployee.toString(),
                    project.status
               ];
               data.push( rowData );
          } );
          return data;
     };

     return (
          <React.Fragment>
               <PageTitle title={ 'Projects' } />
               <Row>
                    <Col>
                         <Card>
                              <Card.Body>
                                   <div className="d-flex justify-content-end mb-3">
                                        <ExportToExcel
                                             data={ prepareExportData() }
                                             filename="Projects.xlsx"
                                             sheetName="Projects"
                                             buttonText="Export to Excel"
                                        />
                                        <ProjectAddAction addProject={ addProject } />
                                   </div>
                                   <Table bordered responsive>
                                        <thead>
                                             <tr>
                                                  <th>CREATED DATE</th>
                                                  <th>PROJECT NAME</th>
                                                  <th>CLIENT NAME</th>
                                                  <th>ASSIGN EMPLOYEE</th>
                                                  <th>BUDGET (PER HOUR)</th>
                                                  <th>BUDGET FOR EMPLOYEE (PER HOUR)</th>
                                                  <th>STATUS</th>
                                                  <th>ACTION</th>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             { projects.length === 0 ? (
                                                  <tr>
                                                       <td colSpan={ 8 } className="text-center">No projects added yet.</td>
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
                                                                                updateProject( project.id, { createdDate: e.target.value } );
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
                                                                                updateProject( project.id, { projectName: e.target.value } );
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
                                                                                updateProject( project.id, { clientName: e.target.value } );
                                                                           } }
                                                                      />
                                                                 ) : (
                                                                      project.clientName
                                                                 ) }
                                                            </td>
                                                            <td>
                                                                 { editing[ project.id ] === 'all' ? (
                                                                      <select
                                                                           className="form-select"
                                                                           name={ `assignEmployee-${ project.id }` }
                                                                           value={ project.assignEmployee }
                                                                           onChange={ ( e ) => {
                                                                                updateProject( project.id, { assignEmployee: e.target.value } );
                                                                           } }
                                                                      >
                                                                           <option value="">Select Employee</option>
                                                                           { users.map( user => (
                                                                                <option key={ user.id } value={ user.fullname }>
                                                                                     { user.fullname }
                                                                                </option>
                                                                           ) ) }
                                                                      </select>
                                                                 ) : (
                                                                      project.assignEmployee
                                                                 ) }
                                                            </td>
                                                            <td>
                                                                 { editing[ project.id ] === 'all' ? (
                                                                      <FormInput
                                                                           type="text"
                                                                           name={ `budgetPerHour-${ project.id }` }
                                                                           value={ project.budgetPerHour.toString() }
                                                                           onChange={ ( e ) => {
                                                                                updateProject( project.id, { budgetPerHour: parseFloat( e.target.value ) || 0 } );
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
                                                                                updateProject( project.id, { budgetForEmployee: parseFloat( e.target.value ) || 0 } );
                                                                           } }
                                                                      />
                                                                 ) : (
                                                                      project.budgetForEmployee.toString()
                                                                 ) }
                                                            </td>
                                                            <td>
                                                                 { editing[ project.id ] === 'all' ? (
                                                                      <select
                                                                           className="form-select"
                                                                           name={ `status-${ project.id }` }
                                                                           value={ project.status }
                                                                           onChange={ ( e ) => {
                                                                                updateProject( project.id, { status: e.target.value } );
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
                                                                 <div className="d-flex">
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
