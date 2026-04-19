import React, { useState, useEffect } from 'react'
import ReactApexChart from 'react-apexcharts'
import { useTimesheetCalculations } from '../../../hooks/useTimesheetCalculations'
import { getISOWeekKey } from '../../../utils/date'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import classNames from 'classnames'
import { WeekNavigation } from '../../../components'
import { COLORS } from '../../../constants/colors'

const SummaryTab = () => {
     const [ weekOffset, setWeekOffset ] = useState( 0 ); // Always start with current week

     // Save weekOffset to localStorage whenever it changes
     React.useEffect( () => {
          localStorage.setItem( 'reports_weekOffset', weekOffset.toString() );
     }, [ weekOffset ] );

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

     // Get days for selected week
     const { days, weekDisplay } = useTimesheetCalculations( weekOffset, [] )

     const projectsSet = React.useRef( new Set<string>() )

     // Fetch timesheet data for selected week - ALL USERS
     useEffect( () => {
          const fetchTimesheetData = async () => {
               try {
                    const today = new Date()
                    const startOfWeek = new Date( Date.UTC( today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() ) )
                    const day = today.getUTCDay()
                    const diff = today.getUTCDate() - day + ( day === 0 ? -6 : 1 ) + weekOffset * 7
                    startOfWeek.setUTCDate( diff )
                    const endOfWeek = new Date( startOfWeek )
                    endOfWeek.setUTCDate( startOfWeek.getUTCDate() + 6 )
                    const weekKey = getISOWeekKey( weekOffset )

                    // Fetch all users
                    const usersRef = collection( db, 'users' )
                    const q = query( usersRef, where( 'role', 'in', [ 'user', 'admin' ] ) )
                    const usersSnapshot = await getDocs( q )

                    const allMembers: string[] = []
                    const memberProjects: Record<string, Record<string, number>> = {}

                    projectsSet.current.clear()

                    for ( const userDoc of usersSnapshot.docs ) {
                         const data = userDoc.data()
                         const fullname = data.fullname || 'Unknown'
                         const firstName = fullname.split( ' ' )[ 0 ] || fullname
                         allMembers.push( firstName )
                         const uid = userDoc.id

                         // Get the specific week doc by id (doc id is weekKey)
                         const weekDocRef = doc( db, 'timesheets', uid, 'weeks', weekKey )
                         const weekDocSnap = await getDoc( weekDocRef )
                         let allRows: any[] = []

                         if ( weekDocSnap.exists() ) {
                              const weekData = weekDocSnap.data()
                              allRows = weekData?.rows || []
                         }

                         // Also check localStorage as fallback
                         const localKey = `timesheet_${ uid }_${ weekKey }`
                         const localData = localStorage.getItem( localKey )
                         if ( localData && allRows.length === 0 ) {
                              try {
                                   allRows = JSON.parse( localData )
                              } catch ( e ) {
                                   console.warn( 'Local data parse error:', e )
                              }
                         }

                         // Compute total hours per project for this member
                         const projectHours: Record<string, number> = {}
                         for ( const row of allRows ) {
                              const projectName = row.project || 'Unknown Project'
                              if ( projectName === 'Select Project' ) continue

                              let rowTotalHours = 0
                              if ( row.times ) {
                                   Object.values( row.times ).forEach( ( timeObj: any ) => {
                                        const timeValue = timeObj?.time
                                        if ( timeValue && typeof timeValue === 'string' && timeValue.includes( ':' ) ) {
                                             const [ h, m ] = timeValue.split( ':' ).map( Number )
                                             if ( !isNaN( h ) && !isNaN( m ) ) {
                                                  rowTotalHours += h + m / 60
                                             }
                                        }
                                   } )
                              }
                              projectHours[ projectName ] = ( projectHours[ projectName ] || 0 ) + rowTotalHours
                              projectsSet.current.add( projectName )
                         }

                         memberProjects[ firstName ] = projectHours
                    }

                    const memberNames = allMembers.sort( ( a, b ) => a.localeCompare( b ) )
                    const uniqueProjects = Array.from( projectsSet.current ).sort()

                    const series = uniqueProjects.map( project => ( {
                         name: project,
                         data: memberNames.map( member => memberProjects[ member ]?.[ project ] || 0 )
                    } ) )

                    setChartData( { categories: memberNames, series } )

               } catch ( err ) {
                    console.error( 'Error fetching admin summary data:', err )
                    setChartData( { categories: [], series: [] } )
               }
          }
          fetchTimesheetData()
     }, [ days, weekOffset ] )

     const seriesForChart = chartData.series

     const chartOptions: ApexCharts.ApexOptions = {
          chart: {
               type: 'bar' as const,
               stacked: true,
               height: 450,
               toolbar: { show: false },
               zoom: { enabled: false },
               background: 'transparent',
               foreColor: 'var(--bs-body-color)'
          },

          theme: {
               mode: isDark ? 'dark' : 'light'
          },

          colors: [
               COLORS.PRIMARY,
               COLORS.SECONDARY,
               COLORS.SUCCESS,
               COLORS.INFO,
               COLORS.WARNING,
               COLORS.DANGER,
               COLORS.PINK,
               COLORS.BLUE
          ],

          plotOptions: {
               bar: {
                    horizontal: false,
                    columnWidth: '50%'
               }
          },

          stroke: {
               width: 1,
               colors: [ 'transparent' ]
          },

          fill: {
               opacity: 1
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
                    text: 'Hours',
                    style: {
                         color: 'var(--bs-body-color, var(--JK-body-color))'
                    }
               }
          },

          yaxis: {
               title: {
                    text: 'Members',
                    style: {
                         color: 'var(--bs-body-color, var(--JK-body-color))'
                    }
               },
               labels: {
                    style: {
                         colors: 'var(--bs-body-color, var(--JK-body-color))'
                    }
               }
          },

          tooltip: {
               theme: isDark ? 'dark' : 'light',
               y: {
                    formatter: ( v ) => `${ v.toFixed( 1 ) } hours`
               }
          },

          legend: {
               position: 'bottom',
               offsetY: 40,
               labels: {
                    colors: 'var(--bs-body-color, var(--JK-body-color))'
               }
          },
     }

     const totalHours = chartData.series.reduce( ( sum, project ) => sum + project.data.reduce( ( s, h ) => s + h, 0 ), 0 )

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
                         Total Hours (All Members): { totalHours.toFixed( 2 ) }
                    </div>
               </div>
               { chartData.categories.length === 0 || chartData.series.length === 0 ? (
                    <div className="text-center p-5">
                         <svg
                              className="icon text-muted mb-3"
                              width="48"
                              height="48"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                         >
                              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                         </svg>
                         <h5 className="text-muted">No timesheet data available</h5>
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
