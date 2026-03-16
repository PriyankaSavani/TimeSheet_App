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
     const [ loading, setLoading ] = useState( true )
     const projectsSet = useRef( new Set<string>() )

     useEffect( () => {
          const fetchEmployeeProjectHours = async () => {
               try {
                    setLoading( true )

                    // Fetch all users (employees)
                    const usersRef = collection( db, 'users' )
                    const q = query( usersRef, where( 'role', 'in', [ 'user', 'admin' ] ) )
                    const usersSnapshot = await getDocs( q )

                    const allEmployees: string[] = []
                    const employeeProjects: Record<string, Record<string, number>> = {}

                    for ( const userDoc of usersSnapshot.docs ) {
                         const fullname = userDoc.data().fullname || 'Unknown'
                         allEmployees.push( fullname )

                         const uid = userDoc.id

                         // Get ALL weeks for this user
                         const weeksRef = collection( db, 'timesheets', uid, 'weeks' )
                         const weeksSnapshot = await getDocs( weeksRef )
                         let allRows: any[] = []

                         for ( const weekDoc of weeksSnapshot.docs ) {
                              const weekData = weekDoc.data()
                              allRows = allRows.concat( weekData.rows || [] )
                         }

                         // Aggregate across all weeks
                         const projectHours: Record<string, number> = {}
                         for ( const row of allRows ) {
                              const projectName = row.project
                              if ( !projectName || projectName === 'Select Project' ) continue

                              let rowTotalMinutes = 0
                              if ( row.times ) {
                                   Object.values( row.times ).forEach( ( time: any ) => {
                                        if ( time && typeof time === 'object' && time.time && typeof time.time === 'string' && time.time.includes( ':' ) ) {
                                             const [ hours, minutes ] = time.time.split( ':' ).map( Number )
                                             if ( !isNaN( hours ) && !isNaN( minutes ) ) {
                                                  rowTotalMinutes += hours * 60 + minutes
                                             }
                                        }
                                   } )
                              }

                              projectHours[ projectName ] = ( projectHours[ projectName ] || 0 ) + rowTotalMinutes / 60
                         }

                         employeeProjects[ fullname ] = projectHours
                         // Collect unique projects
                         Object.keys( projectHours ).forEach( proj => projectsSet.current.add( proj ) )
                    }

                    // Transform to chart format - ALL employees (with 0 if no hours)
                    const employeeNames = allEmployees.sort( ( a, b ) => a.localeCompare( b ) ) // alphabetical
                    const uniqueProjects: string[] = Array.from( projectsSet.current ).sort()

                    const series = uniqueProjects.map( projName => ( {
                         name: projName,
                         data: employeeNames.map( emp => {
                              const projHours = employeeProjects[ emp ] || {}
                              return ( projHours[ projName ] || 0 ) as number
                         } )
                    } ) )

                    setChartData( { categories: employeeNames, series } )
               } catch ( error ) {
                    console.error( 'Error fetching employee project hours:', error )
               } finally {
                    setLoading( false )
               }
          }

          fetchEmployeeProjectHours()
     }, [] )

     const chartOptions: ApexCharts.ApexOptions = {
          chart: {
               type: 'bar',
               stacked: true,
               toolbar: { show: false },
               zoom: { enabled: false }
          },
          plotOptions: {
               bar: {
                    horizontal: true,
                    barHeight: '70%'
               }
          },
          dataLabels: {
               enabled: false
          },
          stroke: {
               width: 1,
               colors: [ 'transparent' ]
          },
          xaxis: {
               categories: chartData.categories,
               labels: {
                    formatter: function ( val ) {
                         return val + 'h'
                    }
               },
               title: {
                    text: 'Hours'
               }
          },
          yaxis: {
               title: {
                    text: 'Employees'
               }
          },
          fill: {
               opacity: 1,
          },
          legend: {
               position: 'right',
               offsetY: 40
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
               'var(--JK-blue)',
          ],
          tooltip: {
               y: {
                    formatter: function ( val ) {
                         return val.toFixed( 1 ) + ' hours'
                    }
               }
          }
     }

     return (
          <Card style={ { maxHeight: '600px' } }>
               <Card.Body>
                    <Card.Title className={ classNames( 'd-flex align-items-center justify-content-between' ) }>
                         Employee Hours by Project (All Time)
                         <FeatherIcon icon='more-vertical' className={ classNames( 'cursor-pointer' ) } />
                    </Card.Title>
                    { loading ? (
                         <div className='text-center p-5'><FeatherIcon icon='clock' className='me-2' />Loading chart...</div>
                    ) : chartData.categories.length === 0 ? (
                         <div className='text-center p-5'><FeatherIcon icon='bar-chart-2' className='me-2' />No employees found</div>
                    ) : (
                         <ReactApexChart
                              options={ chartOptions }
                              series={ chartData.series }
                              type='bar'
                              height={ 450 }
                         />
                    ) }
               </Card.Body>
          </Card>
     )
}

export default EmployeeProjectHoursChart

