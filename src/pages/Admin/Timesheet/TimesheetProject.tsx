import React, { useState, useEffect } from 'react'
import { Form, Dropdown } from 'react-bootstrap';
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
     const [ searchTerm, setSearchTerm ] = useState<string>( '' );
     const [ showDropdown, setShowDropdown ] = useState<boolean>( false );

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
                              return p.assignEmployee && Array.isArray( p.assignEmployee ) && p.assignEmployee.includes( fullname );
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
          const filteredProjects = availableProjects.filter( project =>
               project.toLowerCase().includes( searchTerm.toLowerCase() )
          );

          return (
               <Dropdown show={ showDropdown } onToggle={ setShowDropdown }>
                    <Dropdown.Toggle variant="outline-secondary" id="dropdown-basic" className="w-100">
                         Select Project
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="">
                         <Form.Control
                              type="text"
                              placeholder="Search projects..."
                              value={ searchTerm }
                              onChange={ ( e ) => setSearchTerm( e.target.value ) }
                              onClick={ ( e ) => e.stopPropagation() }
                              className="mb-2"
                         />
                         { filteredProjects.length > 0 ? (
                              filteredProjects.map( projectName => (
                                   <Dropdown.Item
                                        key={ projectName }
                                        onClick={ () => {
                                             updateProject( rowId, projectName );
                                             setSearchTerm( '' );
                                             setShowDropdown( false );
                                        } }
                                   >
                                        { projectName }
                                   </Dropdown.Item>
                              ) )
                         ) : (
                              <Dropdown.Item disabled>No projects found</Dropdown.Item>
                         ) }
                    </Dropdown.Menu>
               </Dropdown>
          );
     }
}

export default TimesheetProject
