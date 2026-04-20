import React, { useState, useEffect } from 'react'
import ReactApexChart from 'react-apexcharts'
import { doc, getDoc } from 'firebase/firestore'
import { getISOWeekKey } from '../../../utils/date'
import { db, auth } from '../../../config/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import classNames from 'classnames'
import { useTimesheetCalculations } from '../../../hooks/useTimesheetCalculations'
import { WeekNavigation } from '../../../components'
import { COLORS } from '../../../constants/colors'
import FeatherIcon from 'feather-icons-react'

const SummaryTab = () => {
     const [ weekOffset, setWeekOffset ] = useState( 0 ); // Always start with current week

     // Save weekOffset to localStorage whenever it changes
     React.useEffect( () => {
          localStorage.setItem( 'reports_weekOffset', weekOffset.toString() );
     }, [ weekOffset ] );

     const [ userId, setUserId ] = useState<string>( 'anonymous' )

     const [ chartData, setChartData ] = useState<{
          categories: string[],
          series: { name: string, data: number[] }[]
     }>( { categories: [], series: [] } )

     // Bootstrap theme state
     const getBsTheme = () =>
          document.documentElement.getAttribute( 'data-bs-theme' ) ??
          document.body.getAttribute( 'data-bs-theme' ) ??
          'light'

     const [ bsTheme, setBsTheme ] = useState<'light' | 'dark'>( getBsTheme() as any )
     const isDark = bsTheme === 'dark'

     // Watch for Bootstrap theme change
     useEffect( () => {
          const observer = new MutationObserver( () => {
               setBsTheme( getBsTheme() as any )
          } )

          observer.observe( document.documentElement, {
               attributes: true,
               attributeFilter: [ 'data-bs-theme' ]
          } )

          observer.observe( document.body, {
               attributes: true,
               attributeFilter: [ 'data-bs-theme' ]
          } )

          return () => observer.disconnect()
     }, [] )

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
     const { days, weekDisplay } = useTimesheetCalculations( weekOffset, [] )

     // Fetch timesheet data for selected week
     useEffect( () => {
          if ( userId !== 'anonymous' ) {
               const fetchTimesheetData = async () => {
                    const weekKey = getISOWeekKey( weekOffset );
                    const localStorageKey = `timesheet_${ userId }_${ weekKey }`;

                    // First, load from localStorage
                    const localData = localStorage.getItem( localStorageKey )
                    if ( localData ) {
                         try {
                              const rows = JSON.parse( localData )

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
                                        const totalHoursForSeries = data.reduce( ( sum, h ) => sum + ( h > 0 ? h : 0 ), 0 );
                                        if ( totalHoursForSeries > 0 && !taskName.includes( 'Unknown' ) && !projectName.includes( 'Unknown' ) ) {
                                             series.push( {
                                                  name: `${ taskName } (${ projectName })`,
                                                  data
                                             } );
                                        }
                                   } )
                              } )

                              setChartData( { categories: days, series } )
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
                              const firestoreRows = data.rows || []

                              // Calculate hours per task per day per project from Firestore
                              const taskDayProjectHours: Record<string, Record<string, Record<string, number>>> = {}

                              firestoreRows.forEach( ( row: any ) => {
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
                                        const totalHoursForSeries = data.reduce( ( sum, h ) => sum + ( h > 0 ? h : 0 ), 0 );
                                        if ( totalHoursForSeries > 0 && !taskName.includes( 'Unknown' ) && !projectName.includes( 'Unknown' ) ) {
                                             series.push( {
                                                  name: `${ taskName } (${ projectName })`,
                                                  data
                                             } );
                                        }
                                   } )
                              } )

                              setChartData( { categories: days, series } )
                         } else if ( !localData ) {
                              // No data in localStorage or Firestore, set empty
                              setChartData( { categories: days, series: [] } )
                         }
                    } catch ( error ) {
                         console.error( 'Error fetching timesheet data:', error )
                    }
               }
               fetchTimesheetData()
          }
     }, [ userId, days, weekOffset ] )

     const colors = [
          COLORS.PRIMARY,
          COLORS.SECONDARY,
          COLORS.SUCCESS,
          COLORS.INFO,
          COLORS.WARNING,
          COLORS.DANGER,
          COLORS.LIGHT,
          COLORS.DARK,
          COLORS.PINK,
          COLORS.BLUE
     ]

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

     const chartOptions: ApexCharts.ApexOptions = {

          chart: {
               type: 'bar' as const,
               height: 450,
               toolbar: { show: false },
               zoom: { enabled: false },
               background: 'transparent',
               foreColor: 'var(--bs-body-color)'
          },

          theme: {
               mode: isDark ? 'dark' : 'light'
          },

          colors: colors,

          plotOptions: {
               bar: {
                    horizontal: false,
                    columnWidth: '50%',
               },
          },

          dataLabels: {
               enabled: false,
          },

          xaxis: {
               categories: chartData.categories,
               labels: {
                    style: {
                         colors: 'var(--bs-body-color, var(--JK-body-color))'
                    }
               },
               title: {
                    text: 'Current Week',
                    style: {
                         color: 'var(--bs-body-color, var(--JK-body-color))'
                    }
               },
          },

          yaxis: {
               title: {
                    text: 'Hours',
                    style: {
                         color: 'var(--bs-body-color, var(--JK-body-color))'
                    }
               },
               labels: {
                    formatter: ( val: number ) => val.toFixed( 2 ),
                    style: {
                         colors: 'var(--bs-body-color, var(--JK-body-color))'
                    }
               },
          },

          legend: {
               position: 'bottom',
               offsetY: 40,
               labels: {
                    colors: 'var(--bs-body-color, var(--JK-body-color))'
               }
          },

          tooltip: {
               theme: isDark ? 'dark' : 'light',
               y: {
                    formatter: ( val: number, opts: any ) => {
                         const dataPointIndex = opts.dataPointIndex
                         const seriesIndex = opts.seriesIndex
                         const originalH = seriesForChart[ seriesIndex ].data[ dataPointIndex ].originalH
                         return originalH === -1 ? 'No hours worked' : `${ originalH.toFixed( 2 ) } hours`
                    },
               }
          },
     }

     const isEmptyChart = !chartData.series.length || chartData.series.every( series => series.data.every( val => val <= 0 ) );

     const totalHours = chartData.series.reduce( ( sum, task ) => sum + task.data.filter( h => h !== -1 ).reduce( ( s, h ) => s + h, 0 ), 0 )

     return (
          <div className="mt-3">
               <div className="d-xl-flex justify-content-between my-3">
                    <WeekNavigation
                         weekOffset={ weekOffset }
                         setWeekOffset={ setWeekOffset }
                         className='mb-3 mb-xl-0'
                    />
               </div>
               <div className={
                    classNames(
                         'bg-light border rounded p-2 mb-3 d-flex align-items-center justify-content-between'
                    )
               }>
                    <div>
                         Total Hours: { totalHours.toFixed( 2 ) }
                    </div>
               </div>
               { isEmptyChart ? (
                    <div className="text-center p-5">
                         <FeatherIcon icon="bar-chart-2" size={ 48 } className="text-muted mb-3" />
                         <h5 className="text-muted">No data available</h5>
                         <p className="text-muted mb-0">No members have logged hours for { weekDisplay || 'the selected week' }</p>
                    </div>
               ) : (
                    <ReactApexChart
                         options={ chartOptions }
                         series={ seriesForChart }
                         type="bar"
                         height={ 450 }
                    />
               ) }
          </div>
     )
}

export default SummaryTab
