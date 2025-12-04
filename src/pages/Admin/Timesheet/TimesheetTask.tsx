import React, { useState, useEffect } from 'react'
import { Form } from 'react-bootstrap'
import { APICore } from '../../../helpers/api/apiCore'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../../config/firebase'

interface TimesheetTaskProps {
     rowId: string;
     value: string;
     isEditing: boolean;
     editingInputs: Record<string, Record<string, string>>;
     setEditingInputs: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>;
     updateTask: ( id: string, task: string ) => void;
     selectedProject?: string; // Add selectedProject prop
}

const TimesheetTask: React.FC<TimesheetTaskProps> = ( { rowId, value, isEditing, editingInputs, setEditingInputs, updateTask, selectedProject } ) => {
     const [ user, setUser ] = useState<any>( null )
     const [ projects, setProjects ] = useState<any[]>( [] )
     const [ availableTasks, setAvailableTasks ] = useState<string[]>( [] )

     useEffect( () => {
          const api = new APICore()
          const loggedUser = api.getLoggedInUser()
          setUser( loggedUser )
     }, [] )

     useEffect( () => {
          const fetchProjects = async () => {
               if ( user && user.role === 'admin' ) {
                    try {
                         const projectsCollection = collection( db, 'projects' )
                         const projectsSnapshot = await getDocs( projectsCollection )
                         const allProjects = projectsSnapshot.docs.map( doc => ( {
                              id: doc.id,
                              ...doc.data()
                         } ) )
                         // For admin, show only projects assigned to the admin
                         const adminProjects = allProjects.filter( ( p: any ) => {
                              const fullname = ( user.firstName + ' ' + user.lastName ).trim()
                              return p.assignEmployee && Array.isArray( p.assignEmployee ) && p.assignEmployee.includes( fullname )
                         } )
                         setProjects( adminProjects )
                    } catch ( error ) {
                         console.error( 'Error fetching projects:', error )
                    }
               }
          }
          fetchProjects()
     }, [ user ] )

     // Update available tasks when selectedProject changes
     useEffect( () => {
          if ( selectedProject && projects.length > 0 ) {
               const project = projects.find( p => p.projectName === selectedProject )
               if ( project && project.task ) {
                    setAvailableTasks( project.task )
               } else {
                    setAvailableTasks( [] )
               }
          } else {
               setAvailableTasks( [] )
          }
     }, [ selectedProject, projects ] )

     const handleKeyDown = ( e: React.KeyboardEvent<HTMLInputElement> ) => {
          if ( e.key === 'Enter' || e.key === 'Tab' ) {
               // Logic can be added here if needed for saving on key press
          }
     }

     return (
          <React.Fragment>
               { availableTasks.length > 0 ? (
                    value ? (
                         <span onClick={ () => updateTask( rowId, '' ) }>
                              { value }
                         </span>
                    ) : (
                         <Form.Select
                              value=""
                              onChange={ ( e ) => {
                                   const val = e.target.value
                                   updateTask( rowId, val )
                              } }
                         >
                              <option value="">Select Task</option>
                              { availableTasks.map( task => (
                                   <option key={ task } value={ task }>
                                        { task }
                                   </option>
                              ) ) }
                         </Form.Select>
                    )
               ) : (
                    value ? (
                         <span onClick={ () => updateTask( rowId, '' ) }>
                              { value }
                         </span>
                    ) : (
                         <Form.Control
                              type="text"
                              placeholder="Enter task"
                              value=""
                              onChange={ ( e ) => {
                                   const val = e.target.value
                                   updateTask( rowId, val )
                              } }
                              onKeyDown={ handleKeyDown }
                         />
                    )
               ) }
          </React.Fragment>
     )
}

export default TimesheetTask
