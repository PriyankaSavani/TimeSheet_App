import PageTitle from 'components/PageTitle'
import React, { useState, useEffect } from 'react'
import { Col, Row } from 'react-bootstrap'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import Statistics from './Statistics'
import ProjectDetails from './ProjectDetails'
import ProjectSummary from './ProjectSummary'
import EmployeeList from './EmployeeList'

const Dashboard = () => {
     const [ employeeCount, setEmployeeCount ] = useState( 0 )
     const [ projectCount, setProjectCount ] = useState( 0 )
     const [ totalWeekHours, setTotalWeekHours ] = useState( '00:00:00' )
     const [ todaysHours, setTodaysHours ] = useState( '00:00:00' )

     const fetchEmployeeCount = async () => {
          try {
               const usersRef = collection( db, 'users' )
               const q = query( usersRef, where( 'role', 'in', [ 'user', 'admin' ] ) )
               const querySnapshot = await getDocs( q )
               setEmployeeCount( querySnapshot.size )
          } catch ( error ) {
               console.error( 'Error fetching employee count:', error )
          }
     }

     const fetchProjectCount = async () => {
          try {
               const projectsRef = collection( db, 'projects' )
               const querySnapshot = await getDocs( projectsRef )
               setProjectCount( querySnapshot.size )
          } catch ( error ) {
               console.error( 'Error fetching project count:', error )
          }
     }

     const fetchTotalWeekHours = async () => {
          try {
               // Generate current week key
               const today = new Date();
               const startOfWeek = new Date( today );
               const day = today.getDay();
               const diff = today.getDate() - day + ( day === 0 ? -6 : 1 );
               startOfWeek.setDate( diff );
               const year = startOfWeek.getFullYear();
               const weekNum = Math.ceil( ( ( startOfWeek.getTime() - new Date( year, 0, 1 ).getTime() ) / 86400000 + 1 ) / 7 );
               const currentWeekKey = `${ year }-W${ weekNum.toString().padStart( 2, '0' ) }`;

               const usersRef = collection( db, 'users' )
               const q = query( usersRef, where( 'role', 'in', [ 'user', 'admin' ] ) )
               const usersSnapshot = await getDocs( q )
               let totalMinutes = 0
               for ( const userDoc of usersSnapshot.docs ) {
                    const uid = userDoc.id
                    let rows: any[] = [];
                    const localStorageKey = `timesheet_${ uid }_${ currentWeekKey }`;
                    const localData = localStorage.getItem( localStorageKey );
                    if ( localData ) {
                         try {
                              rows = JSON.parse( localData );
                         } catch ( error ) {
                              console.error( 'Error parsing localStorage data:', error );
                         }
                    } else {
                         // Fallback to Firestore if no localStorage data
                         const timesheetDocRef = doc( db, 'timesheets', uid, 'weeks', currentWeekKey )
                         const timesheetSnap = await getDoc( timesheetDocRef )
                         if ( timesheetSnap.exists() ) {
                              const timesheetData = timesheetSnap.data()
                              rows = timesheetData.rows || []
                         }
                    }
                    for ( const row of rows ) {
                         // Calculate total from times data instead of relying on pre-calculated total
                         let rowTotalMinutes = 0;
                         if ( row.times ) {
                              Object.values( row.times ).forEach( ( time: any ) => {
                                   if ( time && typeof time === 'string' && time.includes( ':' ) ) {
                                        const [ hours, minutes ] = time.split( ':' ).map( Number )
                                        if ( !isNaN( hours ) && !isNaN( minutes ) ) {
                                             rowTotalMinutes += hours * 60 + minutes
                                        }
                                   }
                              } );
                         }
                         totalMinutes += rowTotalMinutes;
                    }
               }
               const totalHoursCalc = Math.floor( totalMinutes / 60 )
               const totalMins = totalMinutes % 60
               const formatted = `${ totalHoursCalc.toString().padStart( 2, '0' ) }:${ totalMins.toString().padStart( 2, '0' ) }:00`
               setTotalWeekHours( formatted )
          } catch ( error ) {
               console.error( 'Error fetching total hours:', error )
          }
     }

     const fetchTodaysHours = async () => {
          try {
               // Generate current week key
               const todayDate = new Date();
               const startOfWeek = new Date( todayDate );
               const day = todayDate.getDay();
               const diff = todayDate.getDate() - day + ( day === 0 ? -6 : 1 );
               startOfWeek.setDate( diff );
               const year = startOfWeek.getFullYear();
               const weekNum = Math.ceil( ( ( startOfWeek.getTime() - new Date( year, 0, 1 ).getTime() ) / 86400000 + 1 ) / 7 );
               const currentWeekKey = `${ year }-W${ weekNum.toString().padStart( 2, '0' ) }`;

               // Generate today's key using the same logic as useTimesheetCalculations
               const dayName = todayDate.toLocaleDateString( 'en-US', { weekday: 'short' } );
               const monthName = todayDate.toLocaleDateString( 'en-US', { month: 'short' } );
               const dayNum = todayDate.getDate();
               const today = `${ dayName }, ${ dayNum } ${ monthName }`;

               const usersRef = collection( db, 'users' )
               const q = query( usersRef, where( 'role', 'in', [ 'user', 'admin' ] ) )
               const usersSnapshot = await getDocs( q )
               let totalMinutes = 0
               for ( const userDoc of usersSnapshot.docs ) {
                    const uid = userDoc.id
                    let rows: any[] = [];
                    const localStorageKey = `timesheet_${ uid }_${ currentWeekKey }`;
                    const localData = localStorage.getItem( localStorageKey );
                    if ( localData ) {
                         try {
                              rows = JSON.parse( localData );
                         } catch ( error ) {
                              console.error( 'Error parsing localStorage data:', error );
                         }
                    } else {
                         // Fallback to Firestore if no localStorage data
                         const timesheetDocRef = doc( db, 'timesheets', uid, 'weeks', currentWeekKey )
                         const timesheetSnap = await getDoc( timesheetDocRef )
                         if ( timesheetSnap.exists() ) {
                              const timesheetData = timesheetSnap.data()
                              rows = timesheetData.rows || []
                         }
                    }
                    for ( const row of rows ) {
                         if ( row.times && row.times[ today ] && row.times[ today ].includes( ':' ) ) {
                              const [ hours, minutes ] = row.times[ today ].split( ':' ).map( Number )
                              if ( !isNaN( hours ) && !isNaN( minutes ) ) {
                                   totalMinutes += hours * 60 + minutes
                              }
                         }
                    }
               }
               const totalHoursCalc = Math.floor( totalMinutes / 60 )
               const totalMins = totalMinutes % 60
               setTodaysHours( `${ totalHoursCalc.toString().padStart( 2, '0' ) }:${ totalMins.toString().padStart( 2, '0' ) }:00` )
          } catch ( error ) {
               console.error( 'Error fetching todays hours:', error )
          }
     }

     useEffect( () => {
          fetchEmployeeCount()
          fetchProjectCount()
          fetchTotalWeekHours()
          fetchTodaysHours()

          // Update statistics every minute to reflect real-time changes
          const interval = setInterval( () => {
               fetchTotalWeekHours()
               fetchTodaysHours()
          }, 60000 )

          return () => clearInterval( interval )
     }, [] )

     console.log( "todaysHours: ", todaysHours );

     return (
          <React.Fragment>
               <PageTitle title={ 'Dashboard' } />

               <Row>
                    <Col md={ 6 } xl={ 3 }>
                         <Statistics
                              variant='primary'
                              icon='users'
                              title='Employees'
                              descriptions={ `${ employeeCount } Members` }
                         />
                    </Col>
                    <Col md={ 6 } xl={ 3 }>
                         <Statistics
                              variant='success'
                              icon='briefcase'
                              title='Total Projetcs'
                              descriptions={ `${ projectCount } Projects` }
                         />
                    </Col>
                    <Col md={ 6 } xl={ 3 }>
                         <Statistics
                              variant='warning'
                              icon='clock'
                              title='Worked This Week'
                              descriptions={ `${ totalWeekHours } Hours` }
                         />
                    </Col>
                    <Col md={ 6 } xl={ 3 }>
                         <Statistics
                              variant='danger'
                              icon='watch'
                              title='Worked Today'
                              descriptions={ `${ todaysHours } Hours` }
                         />
                    </Col>
               </Row>

               <Row>
                    <Col xl={ 6 }>
                         <ProjectDetails />
                    </Col>
                    <Col xl={ 6 }>
                         <ProjectSummary />
                    </Col>
               </Row>

               <Row>
                    <Col>
                         <EmployeeList />
                    </Col>
               </Row>
          </React.Fragment>
     )
}

export default Dashboard
