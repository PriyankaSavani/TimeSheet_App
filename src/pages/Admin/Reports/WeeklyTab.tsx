import React, { useState, useEffect } from 'react'
import { Table } from 'react-bootstrap'
import { useTimesheetCalculations } from '../../../hooks/useTimesheetCalculations'
import { doc, getDoc, getDocs, collection } from 'firebase/firestore'
import { getISOWeekKey } from '../../../utils/date'
import { db, auth } from '../../../config/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import classNames from 'classnames'
import WeekNavigation from 'components/WeekNavigation'

interface TaskData {
     member: string
     project: string
     task: string
     [ key: string ]: string | number // For day columns and total
}

const WeeklyTab = () => {
     const [ userId, setUserId ] = useState<string>( 'anonymous' )
     const [ userRole, setUserRole ] = useState<string | null>( null )
     const [ tableData, setTableData ] = useState<TaskData[]>( [] )
     const [ weekOffset, setWeekOffset ] = useState<number>( 0 )

     // Get days for current week
     const { days } = useTimesheetCalculations( weekOffset, [] )

     // Listen to auth state changes
     useEffect( () => {
          const unsubscribe = onAuthStateChanged( auth, ( user ) => {
               if ( user ) {
                    setUserId( user.uid )
               } else {
                    setUserId( 'anonymous' )
               }
          } )

          return () => unsubscribe()
     }, [] )

     // Fetch user role
     useEffect( () => {
          if ( userId !== 'anonymous' ) {
               const fetchUserRole = async () => {
                    try {
                         const userDocRef = doc( db, 'users', userId )
                         const docSnap = await getDoc( userDocRef )
                         if ( docSnap.exists() ) {
                              const data = docSnap.data()
                              setUserRole( data.role || null )
                         } else {
                              setUserRole( null )
                         }
                    } catch ( error ) {
                         console.error( 'Error fetching user role:', error )
                         setUserRole( null )
                    }
               }
               fetchUserRole()
          } else {
               setUserRole( null )
          }
     }, [ userId ] )

     // Fetch timesheet data for current week
     useEffect( () => {
          if ( userId !== 'anonymous' && userRole === 'admin' ) {
               const fetchTimesheetData = async () => {
                    const weekKey = getISOWeekKey( weekOffset )

                    const usersSnapshot = await getDocs( collection( db, 'users' ) )
                    const usersList = usersSnapshot.docs.map( ( doc ) => ( {
                         id: doc.id,
                         fullname: doc.data().fullname || doc.data().firstName + ' ' + ( doc.data().lastName || '' ) || 'Unknown Member'
                    } ) )

                    let allRows: any[] = []

                    for ( const user of usersList ) {
                         const timesheetDocRef = doc( db, 'timesheets', user.id, 'weeks', weekKey )
                         const docSnap = await getDoc( timesheetDocRef )
                         if ( docSnap.exists() ) {
                              const data = docSnap.data()
                              const rows = data.rows || []
                              rows.forEach( ( row: any ) => {
                                   row.member = user.fullname
                                   allRows.push( row )
                              } )
                         }
                    }
                    const rows = allRows

                    // Process data: group by project and task
                    const projectTaskMap: Record<string, Record<string, number>> = {}

                    rows.forEach( ( row: any ) => {
                         const member = row.member || 'Unknown Member'
                         const project = row.project || 'No Project'
                         const task = row.task || 'No Task'
                         const key = `${ member }|${ project }|${ task }`

                         if ( !projectTaskMap[ key ] ) {
                              projectTaskMap[ key ] = {}
                              days.forEach( day => {
                                   projectTaskMap[ key ][ day ] = 0
                              } )
                         }

                         days.forEach( day => {
                              const timeData = row.times[ day ]
                              const time = timeData?.time || '00:00'
                              const [ hoursStr, minutesStr ] = time.split( ':' )
                              const hours = parseFloat( hoursStr ) || 0
                              const minutes = parseFloat( minutesStr ) || 0
                              const totalHours = hours + minutes / 60
                              projectTaskMap[ key ][ day ] += totalHours
                         } )
                    } )

                    // Convert to table data
                    const tableRows: TaskData[] = Object.keys( projectTaskMap ).map( key => {
                         const [ member, project, task ] = key.split( '|' )
                         const row: TaskData = { member: member || 'Unknown', project, task }
                         let total = 0
                         days.forEach( day => {
                              const hours = projectTaskMap[ key ][ day ]
                              row[ day ] = hours.toFixed( 2 )
                              total += hours
                         } )
                         row.total = total.toFixed( 2 )
                         return row
                    } )

                    setTableData( tableRows )
               }
               fetchTimesheetData()
          } else {
               setTableData( [] )
          }
     }, [ userId, userRole, days, weekOffset ] )

     const totalHours = tableData.reduce( ( sum, row ) => sum + parseFloat( row.total as string ), 0 )

     return (
          <React.Fragment>
               <div className="mt-3">
                    <WeekNavigation
                         weekOffset={ weekOffset }
                         setWeekOffset={ setWeekOffset }
                         className="mb-3"
                    />
                    <div className={
                         classNames(
                              'bg-light border rounded p-2 mb-3 d-flex align-items-center justify-content-between'
                         )
                    }>
                         <div>Total Hours: { totalHours.toFixed( 2 ) }</div>
                    </div>
                    <Table bordered responsive>
                         <thead className='no-wrap'>
                              <tr>
                                   <th>Member Name</th>
                                   <th>Project Name</th>
                                   <th>Task Name</th>
                                   { days.map( day => (
                                        <th key={ day }>{ day }</th>
                                   ) ) }
                                   <th>Total Hours</th>
                              </tr>
                         </thead>
                         <tbody>
                              { tableData.map( ( row, index ) => (
                                   <tr key={ index }>
                                        <td>{ row.member }</td>
                                        <td>{ row.project }</td>
                                        <td>{ row.task }</td>
                                        { days.map( day => (
                                             <td key={ day } className='text-center'>
                                                  { Number( row[ day ] ) > 0 ? row[ day ] : '—' }
                                             </td>
                                        ) ) }
                                        <td className='text-center'><strong>{ row.total }</strong></td>
                                   </tr>
                              ) ) }
                              { tableData.length === 0 && (
                                   <tr>
                                        <td colSpan={ days.length + 4 } className="text-center">
                                             No data available for this week
                                        </td>
                                   </tr>
                              ) }
                         </tbody>
                    </Table>
               </div>
          </React.Fragment>
     )
}

export default WeeklyTab
