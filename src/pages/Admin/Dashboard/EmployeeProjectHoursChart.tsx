import classNames from 'classnames'
import FeatherIcon from 'feather-icons-react'
import React, { useState, useEffect, useRef } from 'react'
import { Card } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../../config/firebase'

const EmployeeProjectHoursChart = () => {

     const [ chartData, setChartData ] = useState<{
          categories: string[]
          series: { name: string; data: number[] }[]
     }>( { categories: [], series: [] } )

     // Bootstrap theme state
     const getBsTheme = () =>
          document.documentElement.getAttribute( 'data-bs-theme' ) ??
          document.body.getAttribute( 'data-bs-theme' ) ??
          'light'

     const [ bsTheme, setBsTheme ] = useState<'light' | 'dark'>( getBsTheme() as any )
     const isDark = bsTheme === 'dark'

     const projectsSet = useRef( new Set<string>() )

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

     // Fetch data
     useEffect( () => {
          const fetchEmployeeProjectHours = async () => {
               try {

                    const usersRef = collection( db, 'users' )
                    const q = query( usersRef, where( 'role', 'in', [ 'user', 'admin' ] ) )
                    const usersSnapshot = await getDocs( q )

                    const allEmployees: string[] = []
                    const employeeProjects: Record<string, Record<string, number>> = {}

                    for ( const userDoc of usersSnapshot.docs ) {
                         const fullname = userDoc.data().fullname || 'Unknown'
                         const firstName = fullname.split( ' ' )[ 0 ] || fullname
                         allEmployees.push( firstName )
                         const uid = userDoc.id

                         const weeksRef = collection( db, 'timesheets', uid, 'weeks' )
                         const weeksSnapshot = await getDocs( weeksRef )

                         let allRows: any[] = []
                         for ( const weekDoc of weeksSnapshot.docs ) {
                              const weekData = weekDoc.data()
                              allRows = allRows.concat( weekData.rows || [] )
                         }

                         const projectHours: Record<string, number> = {}
                         for ( const row of allRows ) {
                              const projectName = row.project
                              if ( !projectName || projectName === 'Select Project' ) continue

                              let rowTotalMinutes = 0
                              if ( row.times ) {
                                   Object.values( row.times ).forEach( ( time: any ) => {
                                        if (
                                             time &&
                                             typeof time === 'object' &&
                                             typeof time.time === 'string' &&
                                             time.time.includes( ':' )
                                        ) {
                                             const [ h, m ] = time.time.split( ':' ).map( Number )
                                             if ( !isNaN( h ) && !isNaN( m ) ) {
                                                  rowTotalMinutes += h * 60 + m
                                             }
                                        }
                                   } )
                              }

                              projectHours[ projectName ] =
                                   ( projectHours[ projectName ] || 0 ) + rowTotalMinutes / 60
                         }

                         employeeProjects[ firstName ] = projectHours
                         Object.keys( projectHours ).forEach( p => projectsSet.current.add( p ) )
                    }

                    const employeeNames = allEmployees.sort( ( a, b ) => a.localeCompare( b ) )
                    const uniqueProjects = Array.from( projectsSet.current ).sort()

                    const series = uniqueProjects.map( project => ( {
                         name: project,
                         data: employeeNames.map( emp => employeeProjects[ emp ]?.[ project ] || 0 )
                    } ) )

                    setChartData( { categories: employeeNames, series } )

               } catch ( err ) {
                    console.error( err )
               }
          }

          fetchEmployeeProjectHours()
     }, [] )

     // ApexCharts options with Bootstrap theme wired in
     const chartOptions: ApexCharts.ApexOptions = {

          chart: {
               type: 'bar',
               stacked: true,
               toolbar: { show: false },
               zoom: { enabled: false },
               background: 'transparent',
               foreColor: 'var(--bs-body-color)'
          },

          theme: {
               mode: isDark ? 'dark' : 'light'
          },

          plotOptions: {
               bar: {
                    horizontal: true,
                    barHeight: '70%'
               }
          },

          dataLabels: { enabled: false },

          stroke: {
               width: 1,
               colors: [ 'transparent' ]
          },

          xaxis: {
               categories: chartData.categories,
               labels: {
                    formatter: v => `${ v }h`,
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
               labels: {
                    style: {
                         colors: 'var(--bs-body-color, var(--JK-body-color))'
                    }
               },
               title: {
                    text: 'Employees',
                    style: {
                         color: 'var(--bs-body-color, var(--JK-body-color))'
                    }
               }
          },

          fill: { opacity: 1 },

          legend: {
               position: 'bottom',
               offsetY: 40,
               labels: {
                    colors: 'var(--bs-body-color, var(--JK-body-color))'
               }
          },

          colors: [
               'var(--JK-primary)',
               'var(--JK-secondary)',
               'var(--JK-success)',
               'var(--JK-info)',
               'var(--JK-warning)',
               'var(--JK-danger)',
               'var(--JK-light)',
               'var(--JK-dark)',
               'var(--JK-pink)',
               'var(--JK-blue)'
          ],

          tooltip: {
               theme: isDark ? 'dark' : 'light',
               y: {
                    formatter: v => `${ v.toFixed( 1 ) } hours`
               }
          }
     }

     return (
          <Card style={ { maxHeight: '600px' } }>
               <Card.Body>
                    <Card.Title className={ classNames( 'd-flex align-items-center justify-content-between' ) }>
                         Employee Hours by Project
                         <FeatherIcon icon="more-vertical" className="cursor-pointer" />
                    </Card.Title>

                    { chartData.categories.length === 0 ? (
                         <div className="text-center p-5">
                              <FeatherIcon icon="bar-chart-2" className="me-2" />
                              No employees found
                         </div>
                    ) : (
                         <ReactApexChart
                              options={ chartOptions }
                              series={ chartData.series }
                              type="bar"
                              height={ 450 }
                         />
                    ) }
               </Card.Body>
          </Card>
     )
}

export default EmployeeProjectHoursChart