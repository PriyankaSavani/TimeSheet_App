import classNames from 'classnames'
import FeatherIcon from 'feather-icons-react'
import React, { useState, useEffect } from 'react'
import { Card, Table } from 'react-bootstrap'
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { Link } from 'react-router-dom'
import SimpleBar from 'simplebar-react'

interface ProjectDetailsProps {
     id: string;
     projectName: string;
     assignEmployee: string;
     totalHoursToday?: string;
     createdDate?: any;
}

const ProjectDetails = () => {
     const [ projects, setProjects ] = useState<ProjectDetailsProps[]>( [] );

     useEffect( () => {
          const fetchProjectsAndTimesheets = async () => {
               try {
                    const projectsCollection = collection( db, 'projects' );
                    const projectsSnapshot = await getDocs( projectsCollection );
                    const projectsList = projectsSnapshot.docs.map( doc => ( {
                         id: doc.id,
                         projectName: doc.data().projectName,
                         assignEmployee: doc.data().assignEmployee,
                         createdDate: doc.data().createdDate ? new Date( doc.data().createdDate ) : new Date(),
                    } ) ) as ProjectDetailsProps[];

                    // Generate week key for current week (weekOffset=0)
                    const getWeekKey = ( offset: number ) => {
                         const today = new Date();
                         const startOfWeek = new Date( today );
                         const day = today.getDay();
                         const diff = today.getDate() - day + ( day === 0 ? -6 : 1 ) + offset * 7;
                         startOfWeek.setDate( diff );
                         const year = startOfWeek.getFullYear();
                         const weekNum = Math.ceil( ( ( startOfWeek.getTime() - new Date( year, 0, 1 ).getTime() ) / 86400000 + 1 ) / 7 );
                         return `${ year }-W${ weekNum.toString().padStart( 2, '0' ) }`;
                    };
                    const weekKey = getWeekKey( 0 );

                    // For each project, find the assigned employee's UID, then fetch their timesheet for the current week and calculate total hours for today
                    const updatedProjects = await Promise.all( projectsList.map( async ( project ) => {
                         // Find the user document for the assigned employee
                         const usersCollection = collection( db, 'users' );
                         const userQuery = query( usersCollection, where( 'fullname', '==', project.assignEmployee ) );
                         const userSnap = await getDocs( userQuery );
                         let uid = null;
                         if ( !userSnap.empty ) {
                              const userDoc = userSnap.docs[ 0 ];
                              uid = userDoc.id; // Assuming UID is the document ID
                         }

                         let totalMinutesToday = 0;
                         if ( uid ) {
                              let rows: any[] = [];
                              const localStorageKey = `timesheet_${ uid }_${ weekKey }`;
                              const localData = localStorage.getItem( localStorageKey );
                              if ( localData ) {
                                   try {
                                        rows = JSON.parse( localData );
                                   } catch ( error ) {
                                        console.error( 'Error parsing localStorage data:', error );
                                   }
                              } else {
                                   // Fallback to Firestore if no localStorage data
                                   const timesheetDocRef = doc( db, 'timesheets', uid, 'weeks', weekKey );
                                   const timesheetSnap = await getDoc( timesheetDocRef );
                                   if ( timesheetSnap.exists() ) {
                                        const timesheetData = timesheetSnap.data();
                                        rows = timesheetData.rows || [];
                                   }
                              }
                              rows.forEach( ( row: any ) => {
                                   if ( row.project === project.projectName && row.times && row.project !== 'Select Project' ) {
                                        Object.values( row.times ).forEach( ( time: any ) => {
                                             if ( time && time.includes( ':' ) ) {
                                                  const [ hours, minutes ] = time.split( ':' ).map( Number );
                                                  totalMinutesToday += hours * 60 + minutes;
                                             }
                                        } );
                                   }
                              } );
                         }
                         const totalHoursToday = Math.floor( totalMinutesToday / 60 );
                         const totalMinsToday = totalMinutesToday % 60;
                         const formattedTotalToday = `${ totalHoursToday.toString().padStart( 2, '0' ) }:${ totalMinsToday.toString().padStart( 2, '0' ) }`;
                         return { ...project, totalHoursToday: formattedTotalToday };
                    } ) );

                    // Sort projects by createdDate in descending order (newest first)
                    const sortedProjects = updatedProjects.sort( ( a, b ) => {
                         if ( a.createdDate && b.createdDate ) {
                              return new Date( b.createdDate ).getTime() - new Date( a.createdDate ).getTime();
                         }
                         return 0;
                    } );
                    setProjects( sortedProjects );
               } catch ( error ) {
                    console.error( 'Error fetching data:', error );
               }
          };

          fetchProjectsAndTimesheets();
     }, [] );

     return (
          <React.Fragment>
               <Card style={ { maxHeight: '500px' } }>
                    <Card.Body>
                         <Card.Title
                              className={
                                   classNames( 'd-flex align-items-center justify-content-between' )
                              }
                         >
                              Project Details
                              <FeatherIcon
                                   icon='more-vertical'
                                   className={ classNames( 'cursor-pointer' ) }
                              />
                         </Card.Title>
                         <SimpleBar style={ { maxHeight: '260px' } }>
                              <Table responsive className={ classNames( 'mb-0' ) }>
                                   <thead>
                                        <tr>
                                             <th>Date</th>
                                             <th>Project Name</th>
                                             <th>Assign Employee Name</th>
                                             <th>Worked Today</th>
                                        </tr>
                                   </thead>
                                   <tbody>
                                        { projects.length === 0 ? (
                                             <tr>
                                                  <td colSpan={ 4 } className="text-center">No projects available.</td>
                                             </tr>
                                        ) : (
                                             projects.map( project => {
                                                  let dateStr = 'N/A';
                                                  if ( project.createdDate ) {
                                                       let date;
                                                       if ( project.createdDate instanceof Date ) {
                                                            // Already a Date object
                                                            date = project.createdDate;
                                                       } else if ( typeof project.createdDate === 'object' && project.createdDate.toDate ) {
                                                            // Firestore Timestamp
                                                            date = project.createdDate.toDate();
                                                       } else {
                                                            // Assume string or other
                                                            date = new Date( project.createdDate );
                                                       }
                                                       if ( !isNaN( date.getTime() ) ) {
                                                            dateStr = date.toLocaleDateString( 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' } );
                                                       }
                                                  }
                                                  return (
                                                       <tr key={ project.id }>
                                                            <td>{ dateStr }</td>
                                                            <td>{ project.projectName }</td>
                                                            <td>{ project.assignEmployee }</td>
                                                            <td>
                                                                 { project.totalHoursToday }
                                                            </td>
                                                       </tr>
                                                  );
                                             } )
                                        ) }
                                   </tbody>
                              </Table>
                         </SimpleBar>
                    </Card.Body>
                    <Card.Footer className={ classNames( 'text-end pt-0' ) }>
                         <Link to=''>
                              View Report
                              <FeatherIcon icon='chevrons-right' className={ classNames( 'ms-1' ) } />
                         </Link>
                    </Card.Footer>
               </Card>
          </React.Fragment >
     )
}

export default ProjectDetails
