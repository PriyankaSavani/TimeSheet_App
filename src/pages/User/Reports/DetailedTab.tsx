import React, { useState, useEffect, useMemo } from 'react'
import { Table } from 'react-bootstrap'
import classNames from 'classnames'
import ExportToExcel from 'components/ExportToExcel'
import ExportToPdf from 'components/ExportToPdf'
import FeatherIcon from 'feather-icons-react'
import MonthNavigation from '../../../components/MonthNavigation'

// image
import logo from "../../../assets/images/logo/LOGO_DARK.png";
import { useSelector } from 'react-redux'
import { selectAuthState } from '../../../redux/auth/selectors'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'

interface DetailedRow {
     date: string
     project: string
     task: string
     description: string
     hours: string
     member: string
}

const DetailedTab = () => {
     const [ detailedData, setDetailedData ] = useState<DetailedRow[]>( [] )
     const [ sortOrder, setSortOrder ] = useState<'asc' | 'desc'>( 'desc' )
     const [ monthOffset, setMonthOffset ] = useState<number>( () => {
          const stored = localStorage.getItem( 'detailedTabMonthOffset' );
          return stored ? parseInt( stored, 10 ) : 0;
     } );

     const { user } = useSelector( selectAuthState );

     const userId = user ? user.id : 'anonymous';
     const username = user ? user.firstName + ' ' + user.lastName : 'anonymous';

     // Generate week key based on weekOffset using UTC time for consistency across timezones
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

     // Fetch timesheet data for selected month from Firestore (matching timesheet page data)
     useEffect( () => {
          if ( userId !== 'anonymous' ) {
               const fetchDetailedData = async () => {
                    const today = new Date()
                    const targetDate = new Date( today.getFullYear(), today.getMonth() + monthOffset, 1 )
                    const year = targetDate.getFullYear()
                    const month = targetDate.getMonth()
                    const startOfMonth = new Date( year, month, 1 )
                    const endOfMonth = new Date( year, month + 1, 0 )

                    const detailedRows: DetailedRow[] = []
                    const seen = new Set<string>()

                    // Loop through each week in the month
                    let currentWeekStart = new Date( startOfMonth )
                    while ( currentWeekStart <= endOfMonth ) {
                         const weekNum = Math.ceil( ( ( currentWeekStart.getTime() - new Date( year, 0, 1 ).getTime() ) / 86400000 + 1 ) / 7 )
                         const weekKey = `${ year }-W${ weekNum.toString().padStart( 2, '0' ) }`
                         const timesheetDocRef = doc( db, 'timesheets', userId, 'weeks', weekKey )

                         // Fetch from Firestore
                         try {
                              const docSnap = await getDoc( timesheetDocRef )
                              if ( docSnap.exists() ) {
                                   const data = docSnap.data()
                                   const rows = data.rows || []
                                   rows.forEach( ( row: any ) => {
                                        Object.keys( row.times || {} ).forEach( day => {
                                             const timeData = row.times[ day ]
                                             const time = timeData?.time || '00:00'
                                             const description = timeData?.description || ''
                                             if ( time !== '00:00' ) {
                                                  // Parse the day string to check if it's within the selected month
                                                  const dayDate = new Date( day + ' ' + new Date().getFullYear() )
                                                  if ( dayDate >= startOfMonth && dayDate <= endOfMonth ) {
                                                       const key = `${ day }-${ row.project || 'No Project' }-${ row.task || 'No Task' }-${ description }-${ time }-${ username }`
                                                       if ( !seen.has( key ) ) {
                                                            seen.add( key )
                                                            detailedRows.push( {
                                                                 date: day,
                                                                 project: row.project || 'No Project',
                                                                 task: row.task || 'No Task',
                                                                 description,
                                                                 hours: time,
                                                                 member: username,
                                                            } )
                                                       }
                                                  }
                                             }
                                        } )
                                   } )
                              }
                         } catch ( error ) {
                              console.error( 'Error fetching timesheet data from Firestore:', error )
                         }

                         // Move to next week
                         currentWeekStart.setDate( currentWeekStart.getDate() + 7 )
                    }

                    setDetailedData( detailedRows )
               }
               fetchDetailedData()
          }
     }, [ userId, username, monthOffset ] )

     const totalHours = detailedData.reduce( ( sum, row ) => {
          const [ hours, minutes ] = row.hours.split( ':' ).map( Number )
          return sum + hours + minutes / 60
     }, 0 )

     // Calculate month start and end dates
     const getMonthDates = () => {
          const today = new Date()
          const targetDate = new Date( today.getFullYear(), today.getMonth() + monthOffset, 1 )
          const year = targetDate.getFullYear()
          const month = targetDate.getMonth()
          const startOfMonth = new Date( year, month, 1 )
          const endOfMonth = new Date( year, month + 1, 0 )
          const formatDate = ( date: Date ) => {
               const month = date.getMonth() + 1
               const day = date.getDate()
               const year = date.getFullYear()
               return `${ month }/${ day }/${ year }`
          }
          return {
               start: formatDate( startOfMonth ),
               end: formatDate( endOfMonth ),
               startOfMonth
          }
     }

     const { start: monthStart, end: monthEnd } = getMonthDates()

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

     // Get month name for filename
     const getMonthName = ( date: Date ) => {
          return date.toLocaleDateString( 'en-US', { month: 'long', year: 'numeric' } );
     }

     const targetDate = new Date( new Date().getFullYear(), new Date().getMonth() + monthOffset, 1 );
     const monthName = getMonthName( targetDate );

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
               <div>
                    <MonthNavigation
                         monthOffset={ monthOffset }
                         setMonthOffset={ setMonthOffset }
                         localStorageKey="detailedTabMonthOffset"
                         className="my-3"
                    />
                    <div className={
                         classNames(
                              'bg-light border rounded p-2 mb-3 d-flex align-items-center justify-content-between'
                         )
                    }>
                         <h5><b>Total Hours:</b> { totalHours.toFixed( 2 ) }</h5>
                         <div>
                              <ExportToExcel
                                   data={ prepareExportToExcelData }
                                   filename={ `DetailedReport_${ monthName.replace( ' ', '_' ) }.xlsx` }
                                   sheetName="Detailed Report"
                                   buttonText="Export to Excel"
                                   addBlankRowAfterHeader={ true }
                                   columnAlignments={ [ 'center', 'center', 'left', 'center', 'center' ] }
                              />
                              <ExportToPdf
                                   data={ prepareExportToPdfData }
                                   filename={ `DetailedReport_${ monthStart.replace( /\//g, '-' ) }_to_${ monthEnd.replace( /\//g, '-' ) }.pdf` }
                                   buttonText="Export to PDF"
                                   buttonVariant="primary"
                                   buttonSize="sm"
                                   title="Detailed Report"
                                   weekStart={ monthStart }
                                   weekEnd={ monthEnd }
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
                                             No data available for this month
                                        </td>
                                   </tr>
                              ) }
                         </tbody>
                    </Table>
               </div>
          </React.Fragment>
     )
}

export default DetailedTab
