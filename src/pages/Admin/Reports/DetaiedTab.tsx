import React, { useState, useEffect } from 'react'
import { Table } from 'react-bootstrap'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '../../../config/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import classNames from 'classnames'
import ExportToExcel from 'components/ExportToExcel'
import ExportToPdf from 'components/ExportToPdf'

// image
import logo from "../../../assets/images/logo/LOGO_DARK.png";

interface DetailedRow {
     task: string
     description: string
     member: string
     time: string
     duration: string
}

const DetaiedTab = () => {
     const [ userId, setUserId ] = useState<string>( 'anonymous' )
     const [ userName, setUserName ] = useState<string>( '' )
     const [ isUserLoading, setIsUserLoading ] = useState<boolean>( true )
     const [ detailedData, setDetailedData ] = useState<DetailedRow[]>( [] )

     console.log( isUserLoading );

     // Listen to auth state changes
     useEffect( () => {
          const unsubscribe = onAuthStateChanged( auth, ( user ) => {
               if ( user ) {
                    setUserId( user.uid )
                    setIsUserLoading( true )
                    // Fetch user profile for full name
                    const fetchUserProfile = async () => {
                         try {
                              const userDocRef = doc( db, 'users', user.uid )
                              const userDocSnap = await getDoc( userDocRef )
                              if ( userDocSnap.exists() ) {
                                   const userData = userDocSnap.data()
                                   const fullName = userData.firstName && userData.lastName ? `${ userData.firstName } ${ userData.lastName }` : userData.fullName || user.displayName || ''
                                   setUserName( fullName )
                              } else {
                                   setUserName( user.displayName || '' )
                              }
                         } catch ( error ) {
                              console.error( 'Error fetching user profile:', error )
                              setUserName( user.displayName || '' )
                         } finally {
                              setIsUserLoading( false )
                         }
                    }
                    fetchUserProfile()
               } else {
                    setUserId( 'anonymous' )
                    setUserName( '' )
                    setIsUserLoading( false )
               }
          } )

          return () => unsubscribe()
     }, [] )

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
                                        task: row.task || 'No Task',
                                        description,
                                        member: userName,
                                        time: day,
                                        duration: time
                                   } )
                              }
                         } )
                    } )

                    setDetailedData( detailedRows )
               }
               fetchDetailedData()
          }
     }, [ userId, userName ] )

     // Update member name in detailedData when userName changes
     useEffect( () => {
          setDetailedData( prev => prev.map( row => ( { ...row, member: userName } ) ) )
     }, [ userName ] )


     const totalHours = detailedData.reduce( ( sum, row ) => {
          const [ hours, minutes ] = row.duration.split( ':' ).map( Number )
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
               end: formatDate( endOfWeek )
          }
     }

     const { start: weekStart, end: weekEnd } = getWeekDates()

     // Prepare data for export to excel
     const prepareExportToExcelData: any[][] = [
          [ 'DATE', 'TASK', 'DESCRIPTION', 'MEMBER', 'DURATION' ],
          ...detailedData.map( ( row: DetailedRow ) => [
               row.time,
               row.task,
               row.description,
               row.member,
               row.duration
          ] )
     ]

     // Prepare data for export to pdf
     const prepareExportToPdfData: any[][] = [
          [ 'DATE', 'TASK', 'DESCRIPTION', 'MEMBER', 'DURATION' ],
          ...detailedData.map( ( row: DetailedRow ) => [
               row.time,
               row.task,
               row.description,
               row.member,
               row.duration
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
                                   <th>TASK</th>
                                   <th>DESCRIPTION</th>
                                   <th>MEMBER</th>
                                   <th>TIME</th>
                                   <th>DURATION</th>
                              </tr>
                         </thead>
                         <tbody>
                              { detailedData.map( ( row, index ) => (
                                   <tr key={ index }>
                                        <td>{ row.task }</td>
                                        <td>{ row.description }</td>
                                        <td>{ row.member }</td>
                                        <td>{ row.time }</td>
                                        <td>{ row.duration }</td>
                                   </tr>
                              ) ) }
                              { detailedData.length === 0 && (
                                   <tr>
                                        <td colSpan={ 5 } className="text-center">
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
