import PageTitle from 'components/PageTitle'
import React, { useState } from 'react'
import { Card, Nav } from 'react-bootstrap'
import SummaryTab from './SummaryTab'
import WeeklyTab from './WeeklyTab'
import DetailedTab from './DetailedTab'

const AdminReports = () => {
     const [ activeTab, setActiveTab ] = useState( 'Summary' )

     return (
          <React.Fragment>
               <PageTitle title={ 'Reports' } />

               <Card>
                    <Card.Body>
                         <Nav variant='tabs'>
                              <Nav.Item>
                                   <Nav.Link
                                        active={ activeTab === 'Summary' }
                                        onClick={ () => setActiveTab( 'Summary' ) }
                                   >
                                        Summary
                                   </Nav.Link>
                              </Nav.Item>
                              <Nav.Item>
                                   <Nav.Link
                                        active={ activeTab === 'Detailed' }
                                        onClick={ () => setActiveTab( 'Detailed' ) }
                                   >
                                        Detailed
                                   </Nav.Link>
                              </Nav.Item>
                              <Nav.Item>
                                   <Nav.Link
                                        active={ activeTab === 'Weekly' }
                                        onClick={ () => setActiveTab( 'Weekly' ) }
                                   >
                                        Weekly
                                   </Nav.Link>
                              </Nav.Item>
                         </Nav>
                         { activeTab === 'Summary' && <SummaryTab /> }
                         { activeTab === 'Detailed' && <DetailedTab /> }
                         { activeTab === 'Weekly' && <WeeklyTab /> }
                    </Card.Body>
               </Card>
          </React.Fragment>
     )
}

export default AdminReports