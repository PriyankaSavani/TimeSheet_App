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
               if ( user && user.role === 'admin' ) {
                    try {
                         const projectsCollection = collection( db, 'projects' );
                         const projectsSnapshot = await getDocs( projectsCollection );
                         const allProjects = projectsSnapshot.docs.map( doc => ( {
                              id: doc.id,
                              ...doc.data()
                         } ) );
                         // For admin, show only projects assigned to the admin
                         const adminProjects = allProjects.filter( ( p: any ) => {
                              const fullname = ( user.firstName + ' ' + user.lastName ).trim();
                              const match = p.assignEmployee && (
                                   ( fullname && p.assignEmployee.toLowerCase() === fullname.toLowerCase() ) ||
                                   ( user.username && p.assignEmployee.toLowerCase() === user.username.toLowerCase() )
                              );
                              return match;
                         } );
                         setProjects( adminProjects );
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

     if ( availableProjects.length === 1 ) {
          // If only one project, display as text, no dropdown
          return (
               <span>
                    { availableProjects[ 0 ] }
               </span>
          );
     }

     if ( availableProjects.length === 0 ) {
          // If no projects assigned, show dropdown for selection
          return (
               <React.Fragment>
                    { isEditing ? (
                         <Form.Select value={ editingInputs[ rowId ]?.project || value } onChange={ ( e ) => {
                              const val = e.target.value;
                              setEditingInputs(
                                   prev => ( {
                                        ...prev,
                                        [ rowId ]: { ...prev[ rowId ], project: val }
                                   } ) );
                              updateProject( rowId, val );
                         } }>
                              <option>Select Project</option>
                              { availableProjects.map( projectName => (
                                   <option key={ projectName } value={ projectName }>
                                        { projectName }
                                   </option>
                              ) ) }
                         </Form.Select>
                    ) : (
                         <span onClick={ () => updateProject( rowId, value ) }>
                              { value }
                         </span>
                    ) }
               </React.Fragment>
          );
     }

     return (
          <React.Fragment>
               { isEditing ? (
                    <Form.Select value={ editingInputs[ rowId ]?.project || value } onChange={ ( e ) => {
                         const val = e.target.value;
                         setEditingInputs(
                              prev => ( {
                                   ...prev,
                                   [ rowId ]: { ...prev[ rowId ], project: val }
                              } ) );
                         updateProject( rowId, val );
                    } }>
                         <option>Select Project</option>
                         { availableProjects.map( projectName => (
                              <option key={ projectName } value={ projectName }>
                                   { projectName }
                              </option>
                         ) ) }
                    </Form.Select>
               ) : (
                    <span onClick={ () => updateProject( rowId, value ) }>
                         { value }
                    </span>
               ) }
          </React.Fragment>
     )
}

export default TimesheetProject
