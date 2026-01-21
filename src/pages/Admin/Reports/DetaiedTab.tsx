import React, { useState, useEffect } from 'react'
import { Table } from 'react-bootstrap'
import { doc, getDoc, getDocs, collection } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import classNames from 'classnames'
import ExportToExcel from 'components/ExportToExcel'
import ExportToPdf from 'components/ExportToPdf'

// image
import logo from "../../../assets/images/logo/LOGO_DARK.png";

interface User {
     id: string;
     fullname: string;
     email: string;
     role: string;
}

interface DetailedRow {
     date: string
     project: string
     task: string
     description: string
     hours: string
     member: string
}

const DetaiedTab = () => {
     const [ detailedData, setDetailedData ] = useState<DetailedRow[]>( [] )

     // Fetch timesheet data for all users for the current week
     useEffect( () => {
          const fetchAllDetailedData = async () => {
               const weekOffset = 0 // current week
               const today = new Date()
               const startOfWeek = new Date( today )
               const day = today.getDay()
               const diff = today.getDate() - day + ( day === 0 ? -6 : 1 ) + weekOffset * 7
               startOfWeek.setDate( diff )
               const year = startOfWeek.getFullYear()
               const weekNum = Math.ceil( ( ( startOfWeek.getTime() - new Date( year, 0, 1 ).getTime() ) / 86400000 + 1 ) / 7 )
               const weekKey = `${ year }-W${ weekNum.toString().padStart( 2, '0' ) }`

               // Fetch all users
               try {
                    const usersSnapshot = await getDocs( collection( db, 'users' ) )
                    const usersList: User[] = usersSnapshot.docs.map( doc => ( {
                         id: doc.id,
                         ...doc.data()
                    } ) as User )

                    // Fetch timesheet data for each user
                    const allDetailedRows: DetailedRow[] = []
                    for ( const user of usersList ) {
                         let rows: any[] = []

                         // Fetch from Firestore
                         try {
                              const timesheetDocRef = doc( db, 'timesheets', user.id, 'weeks', weekKey )
                              const docSnap = await getDoc( timesheetDocRef )
                              if ( docSnap.exists() ) {
                                   const data = docSnap.data()
                                   rows = data.rows || []
                              }
                         } catch ( error ) {
                              console.error( `Error fetching timesheet data for user ${ user.id }:`, error )
                         }

                         // Process data: flatten by day
                         rows.forEach( ( row: any ) => {
                              Object.keys( row.times || {} ).forEach( day => {
                                   const timeData = row.times[ day ]
                                   const time = timeData?.time || '00:00'
                                   const description = timeData?.description || ''
                                   if ( time !== '00:00' ) {
                                        allDetailedRows.push( {
                                             date: day,
                                             project: row.project || 'No Project',
                                             task: row.task || 'No Task',
                                             description,
                                             hours: time,
                                             member: user.fullname,
                                        } )
                                   }
                              } )
                         } )
                    }

                    setDetailedData( allDetailedRows )
               } catch ( error ) {
                    console.error( 'Error fetching users:', error )
               }
          }
          fetchAllDetailedData()
     }, [] )


     const totalHours = detailedData.reduce( ( sum, row ) => {
          const [ hours, minutes ] = row.hours.split( ':' ).map( Number )
          return sum + hours + minutes / 60
     }, 0 )

     // Calculate week start and end dates
     const getWeekDates = () => {
          const today = new Date()
          const startOfWeek = new Date( today )
          const day = today.getDay()
          const diff = today.getDate() - day + ( day === 0 ? -6 : 1 )
          startOfWeek.setDate( diff )
          const endOfWeek = new Date( startOfWeek )
          endOfWeek.setDate( startOfWeek.getDate() + 6 )
          const formatDate = ( date: Date ) => {
               const month = date.getMonth() + 1
               const day = date.getDate()
               const year = date.getFullYear()
               return `${ month }/${ day }/${ year }`
          }
          return {
               start: formatDate( startOfWeek ),
               end: formatDate( endOfWeek ),
               startOfWeek
          }
     }

     const { start: weekStart, end: weekEnd, startOfWeek } = getWeekDates()

     // Function to parse date string like "Mon, 5 Jan" to mm/dd/yyyy
     const parseDateToMMDDYYYY = ( dateStr: string ) => {
          const date = new Date( dateStr + ' ' + new Date().getFullYear() )
          return `${ date.getMonth() + 1 }/${ date.getDate() }/${ date.getFullYear() }`
     }

     // Prepare data for export to excel
     const prepareExportToExcelData: any[][] = [
          [ 'DATE', 'PROJECT', 'TASK', 'DESCRIPTION', 'HOURS', 'MEMBER' ],
          ...detailedData.map( ( row: DetailedRow ) => [
               parseDateToMMDDYYYY( row.date ),
               row.project,
               row.task,
               row.description,
               row.hours,
               row.member,
          ] )
     ]

     // Prepare data for export to pdf
     const prepareExportToPdfData: any[][] = [
          [ 'DATE', 'PROJECT', 'TASK', 'DESCRIPTION', 'HOURS', 'MEMBER' ],
          ...detailedData.map( ( row: DetailedRow ) => [
               parseDateToMMDDYYYY( row.date ),
               row.project,
               row.task,
               row.description,
               row.hours,
               row.member,
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
                         <h5><b>Total Hours:</b> { totalHours.toFixed( 2 ) }</h5>
                         <div>
                              <ExportToExcel
                                   data={ prepareExportToExcelData }
                                   filename="DetailedReport.xlsx"
                                   sheetName="Detailed Report"
                                   buttonText="Export to Excel"
                                   addBlankRowAfterHeader={ true }
                                   columnAlignments={ [ 'center', 'center', 'left', 'center', 'center' ] }
                              />
                              <ExportToPdf
                                   data={ prepareExportToPdfData }
                                   filename={ `DetailedReport.pdf` }
                                   buttonText="Export to PDF"
                                   buttonVariant="primary"
                                   buttonSize="sm"
                                   title="Detailed Report"
                                   weekStart={ weekStart }
                                   weekEnd={ weekEnd }
                                   totalHours={ totalHours }
                                   columnAlignments={ [ 'center', 'center', 'left', 'center', 'center' ] }
                                   orientation="portrait"
                                   logo={ logo }
                              />
                         </div>
                    </div>
                    <Table bordered responsive>
                         <thead>
                              <tr>
                                   <th>DATE</th>
                                   <th>PROJECT</th>
                                   <th>TASK</th>
                                   <th>DESCRIPTION</th>
                                   <th>HOURS</th>
                                   <th>MEMBER</th>
                              </tr>
                         </thead>
                         <tbody>
                              { detailedData.map( ( row, index ) => (
                                   <tr key={ index }>
                                        <td>{ parseDateToMMDDYYYY( row.date ) }</td>
                                        <td>{ row.project }</td>
                                        <td>{ row.task }</td>
                                        <td>{ row.description }</td>
                                        <td>{ row.hours }</td>
                                        <td>{ row.member }</td>
                                   </tr>
                              ) ) }
                              { detailedData.length === 0 && (
                                   <tr>
                                        <td colSpan={ 6 } className="text-center">
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

export default DetaiedTab
