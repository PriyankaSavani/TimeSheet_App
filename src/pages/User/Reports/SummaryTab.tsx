import React, { useState, useEffect } from 'react'
import ReactApexChart from 'react-apexcharts'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '../../../config/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import classNames from 'classnames'
import { useTimesheetCalculations } from '../../../hooks/useTimesheetCalculations'
import ExportToExcel from 'components/ExportToExcel'
import ExportToPdf from 'components/ExportToPdf'

// image
import logo from "../../../assets/images/logo/LOGO_DARK.png";

const SummaryTab = ( { weekOffset }: { weekOffset: number } ) => {
     const [ userId, setUserId ] = useState<string>( 'anonymous' )
     const [ chartData, setChartData ] = useState<{ categories: string[], series: { name: string, data: number[] }[] }>( { categories: [], series: [] } )

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

     // Get days for selected week
     const { days } = useTimesheetCalculations( weekOffset, [] )

     // Fetch timesheet data for selected week
     useEffect( () => {
          if ( userId !== 'anonymous' ) {
               const fetchTimesheetData = async () => {
                    const today = new Date()
                    const startOfWeek = new Date( Date.UTC( today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() ) )
                    const day = today.getUTCDay()
                    const diff = today.getUTCDate() - day + ( day === 0 ? -6 : 1 ) + weekOffset * 7
                    startOfWeek.setUTCDate( diff )
                    const endOfWeek = new Date( startOfWeek )
                    endOfWeek.setUTCDate( startOfWeek.getUTCDate() + 6 )
                    const year = startOfWeek.getUTCFullYear()
                    const weekNum = Math.ceil( ( ( startOfWeek.getTime() - new Date( Date.UTC( year, 0, 1 ) ).getTime() ) / 86400000 + 1 ) / 7 )
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

                    // Calculate hours per task per day per project
                    const taskDayProjectHours: Record<string, Record<string, Record<string, number>>> = {}

                    rows.forEach( ( row: any ) => {
                         const taskName = row.task || 'Unknown Task'
                         const projectName = row.project || 'Unknown Project'
                         if ( !taskDayProjectHours[ taskName ] ) {
                              taskDayProjectHours[ taskName ] = {}
                         }
                         if ( !taskDayProjectHours[ taskName ][ projectName ] ) {
                              taskDayProjectHours[ taskName ][ projectName ] = {}
                              days.forEach( day => {
                                   taskDayProjectHours[ taskName ][ projectName ][ day ] = 0
                              } )
                         }
                         days.forEach( day => {
                              const timeData = row.times[ day ]
                              const timeValue = timeData?.time
                              let hours = 0
                              if ( timeData == null || timeValue == null || timeValue === '' ) {
                                   hours = -1 // No entry
                              } else if ( typeof timeValue === 'number' ) {
                                   hours = timeValue
                              } else if ( typeof timeValue === 'string' ) {
                                   if ( timeValue.includes( ':' ) ) {
                                        const [ h, m ] = timeValue.split( ':' ).map( Number )
                                        if ( !isNaN( h ) && !isNaN( m ) ) {
                                             hours = h + m / 60
                                        } else {
                                             hours = -1
                                        }
                                   } else {
                                        hours = parseFloat( timeValue ) || -1
                                   }
                              } else {
                                   hours = -1
                              }
                              taskDayProjectHours[ taskName ][ projectName ][ day ] += hours
                         } )
                    } )

                    // Create series for each task-project combination
                    const series: { name: string, data: number[] }[] = []
                    Object.keys( taskDayProjectHours ).forEach( taskName => {
                         Object.keys( taskDayProjectHours[ taskName ] ).forEach( projectName => {
                              const data = days.map( day => taskDayProjectHours[ taskName ][ projectName ][ day ] || 0 )
                              series.push( {
                                   name: `${ taskName } (${ projectName })`,
                                   data
                              } )
                         } )
                    } )

                    setChartData( { categories: days, series } )
               }
               fetchTimesheetData()
          }
     }, [ userId, days ] )

     const colors = [ '#6658dd', '#f7b84b', '#f1556c', '#1abc9c', '#4a81d4', '#e3eaef' ]

     const seriesForChart = chartData.series.map( ( task, index ) => {
          return {
               name: task.name,
               data: task.data.map( ( h, dayIndex ) => ( {
                    x: days[ dayIndex ],
                    y: h === -1 ? 0 : h,
                    originalH: h
               } ) )
          }
     } )

     const chartOptions = {
          chart: {
               type: 'bar' as const,
               height: 450,
               toolbar: {
                    show: false,
               },
          },
          colors: colors,
          plotOptions: {
               bar: {
                    horizontal: false,
                    columnWidth: '50%',
                    stacked: true,
               },
          },
          dataLabels: {
               enabled: false,
          },
          xaxis: {
               categories: chartData.categories,
               title: {
                    text: 'Current Week',
               },
          },
          yaxis: {
               title: {
                    text: 'Hours',
               },
               labels: {
                    formatter: ( val: number ) => val.toFixed( 2 ),
               },
          },
          tooltip: {
               y: {
                    formatter: ( val: number, opts: any ) => {
                         const dataPointIndex = opts.dataPointIndex
                         const seriesIndex = opts.seriesIndex
                         const originalH = seriesForChart[ seriesIndex ].data[ dataPointIndex ].originalH
                         return originalH === -1 ? 'No hours worked' : `${ originalH.toFixed( 2 ) } hours`
                    },
               },
          },
     }

     const totalHours = chartData.series.reduce( ( sum, task ) => sum + task.data.filter( h => h !== -1 ).reduce( ( s, h ) => s + h, 0 ), 0 )

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
          [ 'Project Name', 'Task Name', ...days, 'Total Hours' ],
          ...chartData.series.map( task => {
               const [ taskName, projectName ] = task.name.split( ' (' )
               const project = projectName ? projectName.slice( 0, -1 ) : ''
               // Replace -1 with 0 before calculating total
               const total = task.data.reduce( ( sum, h ) => sum + ( h === -1 ? 0 : h ), 0 )
               return [
                    project,
                    taskName,
                    ...task.data.map( h => ( h === -1 ? 0 : h ).toFixed( 2 ) ),
                    total.toFixed( 2 )
               ]
          } )
     ]

     // Prepare data for export to pdf
     const prepareExportToPdfData: any[][] = [
          [ 'Project Name', 'Task Name', ...days, 'Total Hours' ],
          ...chartData.series.map( task => {
               const [ taskName, projectName ] = task.name.split( ' (' )
               const project = projectName ? projectName.slice( 0, -1 ) : ''
               // Replace -1 with 0 before calculating total
               const total = task.data.reduce( ( sum, h ) => sum + ( h === -1 ? 0 : h ), 0 )
               return [
                    project,
                    taskName,
                    ...task.data.map( h => ( h === -1 ? 0 : h ).toFixed( 2 ) ),
                    total.toFixed( 2 )
               ]
          } )
     ]

     return (
          <div className="mt-3">
               <div className={
                    classNames(
                         'bg-light border rounded p-2 mb-3 d-flex align-items-center justify-content-between'
                    )
               }>
                    <div>
                         Total Hours: { totalHours.toFixed( 2 ) }
                    </div>
                    <div>
                         <ExportToExcel
                              data={ prepareExportToExcelData }
                              filename="SummaryReport.xlsx"
                              sheetName='Summary Report'
                              buttonText='Export to Excel'
                              columnAlignments={ [] }
                         />
                         <ExportToPdf
                              data={ prepareExportToPdfData }
                              filename='SummaryReport.pdf'
                              buttonText='Export To PDF'
                              buttonVariant='primary'
                              buttonSize='sm'
                              title='Summary Report'
                              weekStart={ weekStart }
                              weekEnd={ weekEnd }
                              totalHours={ totalHours }
                              columnAlignments={ [] }
                              orientation='landscape'
                              logo={ logo }
                         />
                    </div>
               </div>
               <ReactApexChart
                    options={ chartOptions }
                    series={ seriesForChart }
                    type="bar"
                    height={ 450 }
               />
          </div>
     )
}

export default SummaryTab
