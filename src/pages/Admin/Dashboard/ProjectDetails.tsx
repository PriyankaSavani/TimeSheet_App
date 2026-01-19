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
     assignEmployee: string[];
     totalHoursToday?: string;
     createdDate?: any;
     employeeNames?: string[];
}

const ProjectDetails = () => {
     const [ projects, setProjects ] = useState<ProjectDetailsProps[]>( [] );

     useEffect( () => {
          ( async () => {
               try {
                    // Generate week key for current week (weekOffset=0) using UTC time for consistency across timezones
                    const getWeekKey = ( offset: number ) => {
                         const today = new Date();
                         const startOfWeek = new Date( Date.UTC( today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() ) );
                         const day = today.getUTCDay();
                         const diff = today.getUTCDate() - day + ( day === 0 ? -6 : 1 ) + offset * 7;
                         startOfWeek.setUTCDate( diff );
                         const year = startOfWeek.getUTCFullYear();
                         const weekNum = Math.ceil( ( ( startOfWeek.getTime() - new Date( Date.UTC( year, 0, 1 ) ).getTime() ) / 86400000 + 1 ) / 7 );
                         return `${ year }-W${ weekNum.toString().padStart( 2, '0' ) }`;
                    };
                    const weekKey = getWeekKey( 0 );

                    // Generate today's key using the same logic as useTimesheetCalculations
                    const todayDate = new Date();
                    const dayName = todayDate.toLocaleDateString( 'en-US', { weekday: 'short' } );
                    const monthName = todayDate.toLocaleDateString( 'en-US', { month: 'short' } );
                    const dayNum = todayDate.getDate();
                    const today = `${ dayName }, ${ dayNum } ${ monthName }`;

                    const projectsCollection = collection( db, 'projects' );
                    const projectsSnapshot = await getDocs( projectsCollection );
                    const projectsList = projectsSnapshot.docs.map( doc => ( {
                         id: doc.id,
                         projectName: doc.data().projectName,
                         assignEmployee: doc.data().assignEmployee as string[],
                         createdDate: doc.data().createdDate ? ( doc.data().createdDate.toDate ? doc.data().createdDate.toDate() : new Date( doc.data().createdDate ) ) : null,
                    } ) ) as ProjectDetailsProps[];

                    // For each project, fetch employee UIDs from names and calculate total hours for today from all assigned employees
                    const updatedProjects = await Promise.all( projectsList.map( async ( project ) => {
                         // Fetch UIDs from employee names
                         const employeeUids = await Promise.all( project.assignEmployee.map( async ( name: string ) => {
                              const usersRef = collection( db, 'users' );
                              const q = query( usersRef, where( 'fullname', '==', name ) );
                              const querySnapshot = await getDocs( q );
                              if ( !querySnapshot.empty ) {
                                   return querySnapshot.docs[ 0 ].id;
                              }
                              return null;
                         } ) );
                         const validUids = employeeUids.filter( uid => uid !== null ) as string[];
                         const employeeNames = project.assignEmployee; // Names are already in assignEmployee

                         // Calculate total hours for today from all assigned employees
                         let totalMinutesToday = 0;
                         for ( const uid of validUids ) {
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
                              for ( const row of rows ) {
                                   if ( row.project === project.projectName && row.times && row.project !== 'Select Project' ) {
                                        const timeData = row.times[ today ];
                                        if ( timeData && ( ( typeof timeData === 'string' && timeData.includes( ':' ) ) || ( typeof timeData === 'object' && timeData.time && typeof timeData.time === 'string' && timeData.time.includes( ':' ) ) ) ) {
                                             const timeStr = typeof timeData === 'string' ? timeData : timeData.time;
                                             const [ hours, minutes ] = timeStr.split( ':' ).map( Number );
                                             if ( !isNaN( hours ) && !isNaN( minutes ) ) {
                                                  totalMinutesToday += hours * 60 + minutes;
                                             }
                                        }
                                   }
                              }
                         }
                         const totalHoursToday = Math.floor( totalMinutesToday / 60 );
                         const totalMinsToday = totalMinutesToday % 60;
                         const formattedTotalToday = `${ totalHoursToday.toString().padStart( 2, '0' ) }:${ totalMinsToday.toString().padStart( 2, '0' ) }`;
                         return { ...project, totalHoursToday: formattedTotalToday, employeeNames };
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
          } )();
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
                                                            <td>
                                                                 { project.employeeNames && project.employeeNames.length > 0
                                                                      ? project.employeeNames.map( ( name, index ) => (
                                                                           <span key={ index }>
                                                                                { name }
                                                                                { index < project.employeeNames!.length - 1 && <br /> }
                                                                           </span>
                                                                      ) )
                                                                      : 'No employees assigned'
                                                                 }
                                                            </td>
                                                            <td>{ project.totalHoursToday }</td>
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
