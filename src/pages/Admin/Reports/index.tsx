import PageTitle from 'components/PageTitle'
import React, { useState } from 'react'
import { Card, Nav } from 'react-bootstrap'
import { WeekNavigation } from '../../../components'
import SummaryTab from './SummaryTab'
import WeeklyTab from './WeeklyTab'
import DetaiedTab from './DetaiedTab'

const AdminReports = () => {
     const [ activeTab, setActiveTab ] = useState( 'Summary' )
     const [ weekOffset, setWeekOffset ] = useState( 0 ); // Always start with current week

     // Save weekOffset to localStorage whenever it changes
     React.useEffect( () => {
          localStorage.setItem( 'reports_weekOffset', weekOffset.toString() );
     }, [ weekOffset ] );

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
                         { activeTab === 'Summary' && (
                              <>
                                   <div className="d-xl-flex justify-content-between my-3">
                                        <WeekNavigation
                                             weekOffset={ weekOffset }
                                             setWeekOffset={ setWeekOffset }
                                             localStorageKey="reports_weekOffset"
                                             className='mb-3 mb-xl-0'
                                        />
                                   </div>
                                   <SummaryTab weekOffset={ weekOffset } />
                              </>
                         ) }
                         { activeTab === 'Detailed' && <DetaiedTab /> }
                         { activeTab === 'Weekly' && <WeeklyTab /> }
                    </Card.Body>
               </Card>
          </React.Fragment>
     )
}

export default AdminReports