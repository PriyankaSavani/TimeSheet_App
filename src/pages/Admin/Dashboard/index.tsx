import PageTitle from 'components/PageTitle'
import React, { useState, useEffect } from 'react'
import { Col, Row } from 'react-bootstrap'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import Statistics from './Statistics'
import EmployeeList from './EmployeeList'
import EmployeeProjectHoursChart from './EmployeeProjectHoursChart'

const Dashboard = () => {
     const [ employeeCount, setEmployeeCount ] = useState( 0 )
     const [ projectCount, setProjectCount ] = useState( 0 )
     const [ clientCount, setClientCount ] = useState( 0 )

     const fetchEmployeeCount = async () => {

          try {
               const usersRef = collection( db, 'users' )
               const q = query( usersRef, where( 'role', 'in', [ 'user', 'admin' ] ) )
               const querySnapshot = await getDocs( q )
               setEmployeeCount( querySnapshot.size )
          } catch ( error ) {
               console.error( 'Error fetching employee count:', error )
          }
     }

     const fetchProjectCount = async () => {
          try {
               const projectsRef = collection( db, 'projects' )
               const querySnapshot = await getDocs( projectsRef )
               setProjectCount( querySnapshot.size )

               // Calculate unique clients
               const clientSet = new Set()
               querySnapshot.docs.forEach( doc => {
                    const clientName = doc.data().clientName
                    if ( clientName ) {
                         clientSet.add( clientName )
                    }
               } )
               setClientCount( clientSet.size )
          } catch ( error ) {
               console.error( 'Error fetching project/client count:', error )
          }
     }

     useEffect( () => {
          fetchEmployeeCount()
          fetchProjectCount()
     }, [] )

     return (
          <React.Fragment>
               <PageTitle title={ 'Dashboard' } />

               <Row>
                    <Col lg={ 3 }>
                         <Row>
                              <Col>
                                   <Statistics
                                        variant='primary'
                                        icon='briefcase'
                                        title='Total Projetcs'
                                        descriptions={ `${ projectCount } Projects` }
                                   />
                              </Col>
                         </Row>
                         <Row>
                              <Col>
                                   <Statistics
                                        variant='info'
                                        icon='user-check'
                                        title='Total Clients'
                                        descriptions={ `${ clientCount } Clients` }
                                   />
                              </Col>
                         </Row>
                         <Row>
                              <Col>
                                   <Statistics
                                        variant='success'
                                        icon='users'
                                        title='Employees'
                                        descriptions={ `${ employeeCount } Members` }
                                   />
                              </Col>
                         </Row>
                    </Col>
                    <Col lg={ 9 }>
                         <EmployeeList />
                    </Col>
               </Row>

               <Row>
                    <Col>
                         <EmployeeProjectHoursChart />
                    </Col>
               </Row>
          </React.Fragment>
     )
}

export default Dashboard
