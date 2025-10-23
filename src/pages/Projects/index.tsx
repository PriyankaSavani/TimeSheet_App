import React, { useState, useEffect } from 'react'
import { Table } from 'react-bootstrap'
import FormInput from '../../components/FormInput'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'

import classNames from 'classnames'

// component
import ProjectAddAction from './ProjectAddAction'
import ProjectDeleteAction from './ProjectDeleteAction'
import ProjectEditAction from './ProjectEditAction'
import ExportToExcel from '../../components/ExportToExcel'
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
          const fetchProjects = async () => {
               try {
                    const projectsCollection = collection( db, 'projects' );
                    const projectsSnapshot = await getDocs( projectsCollection );
                    const projectsList = projectsSnapshot.docs.map( doc => ( {
                         id: doc.id,
                         ...doc.data()
                    } ) as Project );
                    setProjects( projectsList );
               } catch ( error ) {
                    console.error( 'Error fetching projects:', error );
               }
          };

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

          fetchProjects();
          fetchUsers();
     }, [] );

     const addProject = async ( project: Omit<Project, 'id' | 'createdDate'> ) => {
          try {
               const newProject = {
                    createdDate: new Date().toLocaleDateString(),
                    ...project,
               };
               const docRef = await addDoc( collection( db, 'projects' ), newProject );
               const projectWithId: Project = {
                    id: docRef.id,
                    ...newProject,
               };
               setProjects( prev => [ ...prev, projectWithId ] );
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
               await deleteDoc( doc( db, 'projects', id ) );
               setProjects( prev => prev.filter( p => p.id !== id ) );
          } catch ( error ) {
               console.error( 'Error deleting project:', error );
          }
     };

     const updateProject = async ( id: string, updatedProject: Partial<Project> ) => {
          try {
               await updateDoc( doc( db, 'projects', id ), updatedProject );
               setProjects( prev => prev.map( p => p.id === id ? { ...p, ...updatedProject } : p ) );
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
                                                       <option value="active">Active</option>
                                                       <option value="deactive">Deactive</option>
                                                  </select>
                                             ) : (
                                                  project.status
                                             ) }
                                        </td>
                                        <td className={ classNames( 'd-flex' ) }>
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
                                        </td>
                                   </tr>
                              ) )
                         ) }
                    </tbody>
               </Table>
          </React.Fragment>
     )
}

export default Projects
