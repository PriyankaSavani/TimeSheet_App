import React, { useState, useEffect, useMemo } from 'react'
import { Table } from 'react-bootstrap'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import classNames from 'classnames'
import ExportToExcel from 'components/ExportToExcel'
import ExportToPdf from 'components/ExportToPdf'
import FeatherIcon from 'feather-icons-react'

// image
import logo from "../../../assets/images/logo/LOGO_DARK.png";
import { useSelector } from 'react-redux'
import { selectAuthState } from '../../../redux/auth/selectors'

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
     const [ sortOrder, setSortOrder ] = useState<'asc' | 'desc'>( 'desc' )

     const { user } = useSelector( selectAuthState );

     const userId = user ? user.id : 'anonymous';
     const username = user ? user.firstName + ' ' + user.lastName : 'anonymous';

     // Fetch timesheet data for current user/week
     useEffect( () => {
          if ( userId !== 'anonymous' ) {
               const fetchDetailedData = async () => {
                    const weekOffset = 0 // current week
                    const today = new Date()
                    const startOfWeek = new Date( today )
                    const day = today.getDay()
                    const diff = today.getDate() - day + ( day === 0 ? -6 : 1 ) + weekOffset * 7
                    startOfWeek.setDate( diff )
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

                    // Process data: flatten by day
                    const detailedRows: DetailedRow[] = []

                    rows.forEach( ( row: any ) => {
                         Object.keys( row.times || {} ).forEach( day => {
                              const timeData = row.times[ day ]
                              const time = timeData?.time || '00:00'
                              const description = timeData?.description || ''
                              if ( time !== '00:00' ) {
                                   detailedRows.push( {
                                        date: day,
                                        project: row.project || 'No Project',
                                        task: row.task || 'No Task',
                                        description,
                                        hours: time,
                                        member: username,
                                   } )
                              }
                         } )
                    } )

                    setDetailedData( detailedRows )
               }
               fetchDetailedData()
          }
     }, [ userId, username ] )


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

     const { start: weekStart, end: weekEnd } = getWeekDates()

     // Function to parse date string like "Mon, 5 Jan" to mm/dd/yyyy
     const parseDateToMMDDYYYY = ( dateStr: string ) => {
          const date = new Date( dateStr + ' ' + new Date().getFullYear() )
          return `${ date.getMonth() + 1 }/${ date.getDate() }/${ date.getFullYear() }`
     }

     // Sort data by date
     const sortedData = useMemo( () => {
          return [ ...detailedData ].sort( ( a, b ) => {
               const dateA = new Date( parseDateToMMDDYYYY( a.date ) )
               const dateB = new Date( parseDateToMMDDYYYY( b.date ) )
               return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
          } )
     }, [ detailedData, sortOrder ] )

     // Handle sort toggle
     const handleSort = () => {
          setSortOrder( prev => prev === 'asc' ? 'desc' : 'asc' )
     }

     // Prepare data for export to excel
     const prepareExportToExcelData: any[][] = [
          [ 'DATE', 'PROJECT', 'TASK', 'DESCRIPTION', 'HOURS', 'MEMBER' ],
          ...sortedData.map( ( row: DetailedRow ) => [
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
          ...sortedData.map( ( row: DetailedRow ) => [
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
                                   <th className={ 'cursor-pointer align-items-center' } onClick={ handleSort }>
                                        DATE
                                        {
                                             sortOrder === 'asc' &&
                                             <FeatherIcon icon="chevron-up" style={ { float: 'right' } } />
                                        }
                                        {
                                             sortOrder === 'desc' &&
                                             <FeatherIcon icon="chevron-down" style={ { float: 'right' } } />
                                        }
                                   </th>
                                   <th>PROJECT</th>
                                   <th>TASK</th>
                                   <th>DESCRIPTION</th>
                                   <th>HOURS</th>
                                   <th>MEMBER</th>
                              </tr>
                         </thead>
                         <tbody>
                              { sortedData.map( ( row, index ) => (
                                   <tr key={ index }>
                                        <td>{ parseDateToMMDDYYYY( row.date ) }</td>
                                        <td>{ row.project }</td>
                                        <td>{ row.task }</td>
                                        <td>{ row.description }</td>
                                        <td>{ row.hours }</td>
                                        <td>{ row.member }</td>
                                   </tr>
                              ) ) }
                              { sortedData.length === 0 && (
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
