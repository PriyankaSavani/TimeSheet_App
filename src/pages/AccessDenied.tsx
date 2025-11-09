import React from 'react'
import { Button, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import PageTitle from '../components/PageTitle'

const AccessDenied = () => {
     return (
          <React.Fragment>
               <PageTitle
                    breadCrumbItems={ [
                         { label: 'Access Denied', path: '/access-denied', active: true },
                    ] }
                    title={ 'Access Denied' }
               />

               <div className="row justify-content-center">
                    <div className="col-md-6">
                         <Card>
                              <Card.Body className="text-center p-5">
                                   <div className="mb-4">
                                        <i className="mdi mdi-lock-outline display-1 text-danger"></i>
                                   </div>
                                   <h1 className="display-4 text-danger">403</h1>
                                   <h4 className="mb-3">Access Denied</h4>
                                   <p className="text-muted mb-4">
                                        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                                   </p>
                                   <Link to="/timesheet">
                                        <Button variant="primary">
                                             <i className="mdi mdi-home me-1"></i> Go to Timesheet
                                        </Button>
                                   </Link>
                              </Card.Body>
                         </Card>
                    </div>
               </div>
          </React.Fragment>
     )
}

export default AccessDenied
