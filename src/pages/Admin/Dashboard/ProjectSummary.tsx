import classNames from 'classnames'
import FeatherIcon from 'feather-icons-react'
import React, { useState, useEffect } from 'react'
import { Card } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../../config/firebase'

interface Project {
     id: string;
     status: string;
}

const ProjectSummary = () => {
     const [ projects, setProjects ] = useState<Project[]>( [] );

     useEffect( () => {
          const fetchProjects = async () => {
               try {
                    const projectsCollection = collection( db, 'projects' );
                    const projectsSnapshot = await getDocs( projectsCollection );
                    const projectsList = projectsSnapshot.docs.map( doc => ( {
                         id: doc.id,
                         ...doc.data()
                    } as Project ) );
                    setProjects( projectsList );
               } catch ( error ) {
                    console.error( 'Error fetching projects:', error );
               }
          };

          fetchProjects();
     }, [] );

     const activeCount = projects.filter( p => p.status.toLowerCase() === 'active' ).length;
     const completedCount = projects.filter( p => p.status.toLowerCase() === 'completed' ).length;
     const onHoldCount = projects.filter( p => p.status.toLowerCase() === 'on hold' ).length;

     const chartOptions: ApexCharts.ApexOptions = {
          chart: {
               type: 'donut',
          },
          labels: [ 'Active Projects', 'Completed Projects', 'On Hold Projects' ],
          colors: [ 'var(--JK-primary)', 'var(--JK-info)', 'var(--JK-secondary)' ],
          legend: {
               position: 'right',
          },
          plotOptions: {
               pie: {
                    donut: {
                         size: '60%',
                         labels: {
                              show: true,
                              total: {
                                   show: true,
                                   label: 'Total Projects',
                                   formatter: () => projects.length.toString(),
                                   fontSize: '13px',
                              },
                         },
                    },
               },
          },
          states: {
               hover: {
                    filter: {
                         type: 'none', // Disable color change on hover; change to 'lighten' or 'darken' to modify
                    },
               },
          },
     };

     const chartSeries = [ activeCount, completedCount, onHoldCount ];

     return (
          <React.Fragment>
               <Card style={ { maxHeight: '500px' } }>
                    <Card.Body>
                         <Card.Title
                              className={
                                   classNames( 'd-flex align-items-center justify-content-between' )
                              }
                         >
                              Project Summary
                              <FeatherIcon
                                   icon='more-vertical'
                                   className={ classNames( 'cursor-pointer' ) }
                              />
                         </Card.Title>
                         <ReactApexChart
                              options={ chartOptions }
                              series={ chartSeries }
                              type="donut"
                              height={ 300 }
                              style={ { cursor: 'pointer' } }
                         />
                    </Card.Body>
               </Card>
          </React.Fragment>
     );
};

export default ProjectSummary;
