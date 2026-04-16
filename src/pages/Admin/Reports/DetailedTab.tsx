import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Table, Dropdown } from 'react-bootstrap'
import { doc, getDoc, getDocs, collection } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import classNames from 'classnames'
import ExportToExcel from 'components/ExportToExcel'
import ExportToPdf from 'components/ExportToPdf'
import FeatherIcon from 'feather-icons-react'
import MonthNavigation from '../../../components/MonthNavigation'

// image
import logo from "../../../assets/images/logo/logo-dark.png";

interface User {
     id: string;
     fullname: string;
     email: string;
     role: string;
}

interface Project {
     id: string;
     projectName: string;
     clientName: string;
}

interface DetailedRow {
     date: string
     project: string
     client: string
     task: string
     description: string
     hours: string
     member: string
}

const DetailedTab = () => {
     const [ detailedData, setDetailedData ] = useState<DetailedRow[]>( [] )
     const [ sortOrder, setSortOrder ] = useState<'asc' | 'desc'>( 'desc' )
     const [ selectedProject, setSelectedProject ] = useState<string>( 'All' )
     const [ monthOffset, setMonthOffset ] = useState<number>( () => {
          const stored = localStorage.getItem( 'detailedTabMonthOffset' );
          return stored ? parseInt( stored, 10 ) : 0;
     } );
     const [ projects, setProjects ] = useState<Project[]>( [] )

     // ALL hooks at top
     const getClientName = useCallback( ( projectName: string ): string => {
          const project = projects.find( p => p.projectName === projectName )
          return project?.clientName || ''
     }, [ projects ] )

     const uniqueProjects = useMemo( () => {
          const projects = detailedData.map( row => row.project )
          return [ 'All', ...Array.from( new Set( projects ) ) ].sort()
     }, [ detailedData ] )

     const { start: monthStart, end: monthEnd, startOfMonth } = useMemo( () => {
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
     }, [ monthOffset ] )

     const selectedYear = useMemo( () => startOfMonth.getFullYear(), [ startOfMonth ] )

     // Parses date strings like "1st Jan" to "01/01/YYYY" using the selected year
     const parseDateToMMDDYYYY = useCallback( ( dateStr: string ): string => {
          if ( !dateStr ) return "";

          // ✅ Remove st / nd / rd / th
          const cleaned = dateStr.replace( /(\d+)(st|nd|rd|th)/, "$1" );

          // ✅ Append selected year
          const date = new Date( `${ cleaned } ${ selectedYear }` );

          if ( isNaN( date.getTime() ) ) {
               return dateStr; // fallback (prevents NaN display)
          }

          const mm = String( date.getMonth() + 1 ).padStart( 2, "0" );
          const dd = String( date.getDate() ).padStart( 2, "0" );
          const yyyy = date.getFullYear();

          return `${ mm }/${ dd }/${ yyyy }`;
     }, [ selectedYear ] );

     const filteredData = useMemo( () => {
          if ( selectedProject === 'All' ) {
               return detailedData
          }
          return detailedData.filter( row => row.project === selectedProject )
     }, [ detailedData, selectedProject ] )

     const totalHours = useMemo( () => {
          return filteredData.reduce( ( sum, row ) => {
               const [ hours, minutes ] = row.hours.split( ':' ).map( Number )
               return sum + hours + minutes / 60
          }, 0 )
     }, [ filteredData ] )

     const sortedData = useMemo( () => {
          return [ ...filteredData ].sort( ( a, b ) => {
               const dateA = new Date( parseDateToMMDDYYYY( a.date ) )
               const dateB = new Date( parseDateToMMDDYYYY( b.date ) )
               return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
          } )
     }, [ filteredData, sortOrder, parseDateToMMDDYYYY ] )

     // Fetch projects from Firebase
     useEffect( () => {
          const fetchProjects = async () => {
               try {
                    const projectsSnapshot = await getDocs( collection( db, 'projects' ) )
                    const projectsList: Project[] = projectsSnapshot.docs.map( doc => ( {
                         id: doc.id,
                         projectName: doc.data().projectName || '',
                         clientName: doc.data().clientName || ''
                    } ) )
                    setProjects( projectsList )
               } catch ( error ) {
                    console.error( 'Error fetching projects:', error as Error )
               }
          }
          fetchProjects()
     }, [] )

     // Fetch timesheet data for selected month from Firestore for all users
     useEffect( () => {
          const fetchAllDetailedData = async () => {

               const year = new Date().getFullYear()
               const month = new Date().getMonth() + monthOffset
               const startOfMonth = new Date( year, month, 1 )
               const endOfMonth = new Date( year, month + 1, 0 )

               const detailedRows: DetailedRow[] = []
               const seen = new Set<string>()
               let stats = { users: 0, weeks: 0, docsFound: 0, entriesAdded: 0, entriesSkipped: 0 }

               // Generate week keys for month (like User tab)
               const weekKeys: string[] = []
               let currentWeekStart = new Date( startOfMonth )
               while ( currentWeekStart <= endOfMonth ) {
                    const weekNum = Math.ceil( ( ( currentWeekStart.getTime() - new Date( year, 0, 1 ).getTime() ) / 86400000 + 1 ) / 7 )
                    const weekKey = `${ year }-W${ weekNum.toString().padStart( 2, '0' ) }`
                    weekKeys.push( weekKey )
                    currentWeekStart.setDate( currentWeekStart.getDate() + 7 )
               }

               stats.weeks = weekKeys.length

               try {
                    // Fetch all users
                    const usersSnapshot = await getDocs( collection( db, 'users' ) )
                    const usersList: User[] = usersSnapshot.docs.map( doc => ( {
                         id: doc.id,
                         ...doc.data()
                    } ) as User )

                    stats.users = usersList.length

                    // Fetch timesheet data for each user/week
                    for ( const weekKey of weekKeys ) {
                         for ( const user of usersList ) {
                              try {
                                   const timesheetDocRef = doc( db, 'timesheets', user.id, 'weeks', weekKey )
                                   const docSnap = await getDoc( timesheetDocRef )
                                   if ( docSnap.exists() ) {
                                        stats.docsFound++
                                        const data = docSnap.data()
                                        const rows = data.rows || []
                                        rows.forEach( ( row: any ) => {
                                             Object.keys( row.times || {} ).forEach( day => {
                                                  const timeData = row.times[ day ]
                                                  const time = timeData?.time || '00:00'
                                                  const description = timeData?.description || ''
                                                  // Include ALL entries, even 00:00
                                                  const key = `${ day }-${ row.project || 'No Project' }-${ row.task || 'No Task' }-${ description }-${ time }-${ user.fullname }`
                                                  if ( !seen.has( key ) ) {
                                                       seen.add( key )
                                                       detailedRows.push( {
                                                            date: day,
                                                            project: row.project || 'No Project',
                                                            client: getClientName( row.project || 'No Project' ),
                                                            task: row.task || 'No Task',
                                                            description,
                                                            hours: time,
                                                            member: user.fullname,
                                                       } )
                                                       stats.entriesAdded++
                                                  } else {
                                                       stats.entriesSkipped++
                                                  }
                                             } )
                                        } )
                                   }
                              } catch ( error ) {
                                   console.error( `Error fetching timesheet data for user ${ user.id }:`, error as Error )
                              }
                         }
                    }
                    setDetailedData( detailedRows )
               } catch ( error ) {
                    console.error( 'Error fetching users:', error as Error )
               }
          }
          fetchAllDetailedData()
     }, [ monthOffset, projects, getClientName ] )

     const handleSort = () => {
          setSortOrder( prev => prev === 'asc' ? 'desc' : 'asc' )
     }

     // Prepare data for export to excel
     const prepareExportToExcelData = [
          [ 'DATE', 'PROJECT', 'CLIENT', 'TASK', 'DESCRIPTION', 'HOURS', 'MEMBER' ],
          ...sortedData.map( ( row: DetailedRow ) => [
               parseDateToMMDDYYYY( row.date ),
               row.project,
               row.client,
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
     const prepareExportToPdfData = [
          [ 'DATE', 'PROJECT', 'CLIENT', 'TASK', 'DESCRIPTION', 'HOURS', 'USER NAME' ],
          ...sortedData.map( ( row: DetailedRow ) => [
               parseDateToMMDDYYYY( row.date ),
               row.project,
               row.client,
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
                              'bg-light border rounded p-2 mb-3 d-md-flex align-items-center justify-content-between'
                         )
                    }>
                         <h5><b>Total Hours:</b> { totalHours.toFixed( 2 ) }</h5>
                         <div>
                              <ExportToExcel
                                   data={ prepareExportToExcelData } // 2D array: [headerRow, ...rows]
                                   filename={ `DetailedReport_${ monthName.replace( ' ', '_' ) }.xlsx` }
                                   sheetName="Detailed Report"
                                   buttonText="Export to Excel"
                                   columnAlignments={ [ 'center', 'center', 'center', 'center', 'left', 'center', 'center' ] }
                                   weekEnd={ monthEnd }
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
                                   columnAlignments={ [ 'center', 'center', 'center', 'center', 'left', 'center', 'center' ] }
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
                                   <th className={ 'align-items-center' }>
                                        PROJECT
                                        <Dropdown align="start" className="d-inline">
                                             <Dropdown.Toggle
                                                  variant="transparent"
                                                  id="dropdown-project-filter"
                                                  className="btn-sm border-0 p-0 ms-1"
                                             >
                                                  <FeatherIcon icon="filter" size={ 14 } />
                                             </Dropdown.Toggle>
                                             <Dropdown.Menu>
                                                  <Dropdown.Header>Filter by Project</Dropdown.Header>
                                                  { uniqueProjects.map( ( project ) => (
                                                       <Dropdown.Item
                                                            key={ project }
                                                            onClick={ () => setSelectedProject( project ) }
                                                            active={ selectedProject === project }
                                                       >
                                                            { project }
                                                       </Dropdown.Item>
                                                  ) ) }
                                             </Dropdown.Menu>
                                        </Dropdown>
                                        { selectedProject !== 'All' && (
                                             <span className="badge bg-primary ms-1">{ selectedProject }</span>
                                        ) }
                                   </th>
                                   <th>CLIENT</th>
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
                                        <td>{ row.client }</td>
                                        <td>{ row.task }</td>
                                        <td>{ row.description }</td>
                                        <td>{ row.hours }</td>
                                        <td>{ row.member }</td>
                                   </tr>
                              ) ) }
                              { sortedData.length === 0 && (
                                   <tr>
                                        <td colSpan={ 7 } className="text-center">
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

