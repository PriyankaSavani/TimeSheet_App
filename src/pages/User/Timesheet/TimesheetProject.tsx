import React, { useState, useEffect } from 'react'
import { Form } from 'react-bootstrap';
import { APICore } from '../../../helpers/api/apiCore';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';

interface TimesheetProjectProps {
     rowId: string;
     value: string;
     isEditing: boolean;
     editingInputs: Record<string, Record<string, string>>;
     setEditingInputs: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>;
     updateProject: ( id: string, project: string ) => void;
}

const TimesheetProject: React.FC<TimesheetProjectProps> = ( { rowId, value, isEditing, editingInputs, setEditingInputs, updateProject } ) => {
     const [ user, setUser ] = useState<any>( null );
     const [ projects, setProjects ] = useState<any[]>( [] );

     useEffect( () => {
          const api = new APICore();
          const loggedUser = api.getLoggedInUser();
          setUser( loggedUser );
     }, [] );

     useEffect( () => {
          const fetchProjects = async () => {
               if ( user ) {
                    try {
                         const projectsCollection = collection( db, 'projects' );
                         const projectsSnapshot = await getDocs( projectsCollection );
                         const allProjects = projectsSnapshot.docs.map( doc => ( {
                              id: doc.id,
                              ...doc.data()
                         } ) );
                         // Show only projects assigned to the user
                         const userProjects = allProjects.filter( ( p: any ) => {
                              const fullname = ( user.firstName + ' ' + user.lastName ).trim();
                              let match = false;
                              if ( p.assignEmployee ) {
                                   if ( Array.isArray( p.assignEmployee ) ) {
                                        match = p.assignEmployee.some( ( emp: string ) =>
                                             emp.toLowerCase() === fullname.toLowerCase() ||
                                             ( user.username && emp.toLowerCase() === user.username.toLowerCase() )
                                        );
                                   } else if ( typeof p.assignEmployee === 'string' ) {
                                        match = p.assignEmployee.toLowerCase() === fullname.toLowerCase() ||
                                             ( user.username && p.assignEmployee.toLowerCase() === user.username.toLowerCase() );
                                   }
                              }
                              return match;
                         } );
                         setProjects( userProjects );
                    } catch ( error ) {
                         console.error( 'Error fetching projects:', error );
                    }
               }
          };
          fetchProjects();
     }, [ user ] );

     const availableProjects = projects.map( p => p.projectName );

     useEffect( () => {
          if ( availableProjects.length === 1 && value !== availableProjects[ 0 ] ) {
               updateProject( rowId, availableProjects[ 0 ] );
          }
     }, [ availableProjects, value, rowId, updateProject ] );

     if ( availableProjects.length === 0 ) {
          // If no projects assigned, show text
          return (
               <span>
                    No projects assigned
               </span>
          );
     }

     if ( availableProjects.length === 1 ) {
          // If only one project, display as text
          return (
               <span>
                    { availableProjects[ 0 ] }
               </span>
          );
     }

     // If multiple projects, show dropdown if no value selected, else show text
     if ( value ) {
          return (
               <span onClick={ () => updateProject( rowId, '' ) }>
                    { value }
               </span>
          );
     } else {
          return (
               <Form.Select value="" onChange={ ( e ) => {
                    const val = e.target.value;
                    updateProject( rowId, val );
               } }>
                    <option value="">Select Project</option>
                    { availableProjects.map( projectName => (
                         <option key={ projectName } value={ projectName }>
                              { projectName }
                         </option>
                    ) ) }
               </Form.Select>
          );
     }
}

export default TimesheetProject
