import React, { useState, useEffect } from 'react'
import { Table } from 'react-bootstrap'
import { useTimesheetCalculations } from '../../../hooks/useTimesheetCalculations'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '../../../config/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import classNames from 'classnames'
import ExportToExcel from 'components/ExportToExcel'
import ExportToPdf from 'components/ExportToPdf'

// image
import logo from "../../../assets/images/logo/LOGO_DARK.png";

interface TaskData {
     task: string
     [ key: string ]: string | number // For day columns and total
}

const WeeklyTab = () => {
     const [ userId, setUserId ] = useState<string>( 'anonymous' )
     const [ tableData, setTableData ] = useState<TaskData[]>( [] )
     const [ weekStart, setWeekStart ] = useState<string>( '' )
     const [ weekEnd, setWeekEnd ] = useState<string>( '' )

     // Get days for current week
     const { days } = useTimesheetCalculations( 0, [] )

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

     // Fetch timesheet data for current week
     useEffect( () => {
          if ( userId !== 'anonymous' ) {
               const fetchTimesheetData = async () => {
                    const weekOffset = 0 // current week
                    const today = new Date()
                    const startOfWeek = new Date( today )
                    const day = today.getDay()
                    const diff = today.getDate() - day + ( day === 0 ? -6 : 1 ) + weekOffset * 7
                    startOfWeek.setDate( diff )
                    const endOfWeek = new Date( startOfWeek )
                    endOfWeek.setDate( startOfWeek.getDate() + 6 )
                    setWeekStart( startOfWeek.toDateString() )
                    setWeekEnd( endOfWeek.toDateString() )
                    const year = startOfWeek.getFullYear()
                    const weekNum = Math.ceil( ( ( startOfWeek.getTime() - new Date( year, 0, 1 ).getTime() ) / 86400000 + 1 ) / 7 )
                    const weekKey = `${ year }-W${ weekNum.toString().padStart( 2, '0' ) }`
                    const localStorageKey = `timesheet_${ userId }_${ weekKey }`

                    let rows: any[] = []

                    // First, load from localStorage
                    const localData = localStorage.getItem( localStorageKey )
                    if ( localData ) {
                         try {
                              rows = JSON.parse( localData )
                         } catch ( error ) {
                              console.error( 'Error parsing localStorage data:', error )
                         }
                    }

                    // Then, fetch from Firestore and update if available
                    try {
                         const timesheetDocRef = doc( db, 'timesheets', userId, 'weeks', weekKey )
                         const docSnap = await getDoc( timesheetDocRef )
                         if ( docSnap.exists() ) {
                              const data = docSnap.data()
                              rows = data.rows || []
                         }
                    } catch ( error ) {
                         console.error( 'Error fetching timesheet data:', error )
                    }

                    // Process data: group by task
                    const taskMap: Record<string, Record<string, number>> = {}

                    rows.forEach( ( row: any ) => {
                         const task = row.task || 'No Task'
                         if ( !taskMap[ task ] ) {
                              taskMap[ task ] = {}
                              days.forEach( day => {
                                   taskMap[ task ][ day ] = 0
                              } )
                         }

                         days.forEach( day => {
                              const timeData = row.times[ day ]
                              const time = timeData?.time || '00:00'
                              const [ hours, minutes ] = time.split( ':' ).map( Number )
                              const totalHours = hours + minutes / 60
                              taskMap[ task ][ day ] += totalHours
                         } )
                    } )

                    // Convert to table data
                    const tableRows: TaskData[] = Object.keys( taskMap ).map( task => {
                         const row: TaskData = { task }
                         let total = 0
                         days.forEach( day => {
                              const hours = taskMap[ task ][ day ]
                              row[ day ] = hours.toFixed( 2 )
                              total += hours
                         } )
                         row.total = total.toFixed( 2 )
                         return row
                    } )

                    setTableData( tableRows )
               }
               fetchTimesheetData()
          }
     }, [ userId, days ] )

     const totalHours = tableData.reduce( ( sum, row ) => sum + parseFloat( row.total as string ), 0 )

     // Prepare data for export to excel
     const prepareExportToExcelData: any[][] = [
          [ 'Task Name', ...days, 'Total Hours' ],
          ...tableData.map( row => [
               row.task,
               ...days.map( day => row[ day ] ),
               row.total
          ] )
     ]

     // Prepare data for export to pdf
     const prepareExportToPdfData: any[][] = [
          [ 'Task Name', ...days, 'Total Hours' ],
          ...tableData.map( row => [
               row.task,
               ...days.map( day => row[ day ] ),
               row.total
          ] )
     ]

     return (
          <React.Fragment>
               <div className="mt-3">
                    <div className={
                         classNames(
                              'bg-light border rounded p-2 mb-3 d-flex align-items-center justify-content-between'
                         )
                    }>
                         <div>Total Hours: { totalHours.toFixed( 2 ) }</div>
                         <div>
                              <ExportToExcel
                                   data={ prepareExportToExcelData }
                                   filename="WeeklyReport.xlsx"
                                   sheetName="Weekly Report"
                                   buttonText="Export to Excel"
                                   addBlankRowAfterHeader={ true }
                                   columnAlignments={ [ 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center' ] }
                              />
                              <ExportToPdf
                                   data={ prepareExportToPdfData }
                                   filename="weekly_timesheet.pdf"
                                   buttonText="Export to PDF"
                                   buttonVariant="primary"
                                   buttonSize="sm"
                                   title="Weekly Report"
                                   weekStart={ weekStart }
                                   weekEnd={ weekEnd }
                                   totalHours={ totalHours }
                                   columnAlignments={ [ 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center' ] }
                                   orientation="landscape"
                                   logo={ logo }
                              />
                         </div>
                    </div>
                    <Table bordered responsive>
                         <thead>
                              <tr>
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
                                        <td>{ row.task }</td>
                                        { days.map( day => (
                                             <td key={ day }>{ row[ day ] === "0.00" || !row[ day ] ? "-" : row[ day ] }</td>
                                        ) ) }
                                        <td><strong>{ row.total }</strong></td>
                                   </tr>
                              ) ) }
                              { tableData.length === 0 && (
                                   <tr>
                                        <td colSpan={ days.length + 2 } className="text-center">
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
