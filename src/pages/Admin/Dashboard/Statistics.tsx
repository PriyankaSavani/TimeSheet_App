import classNames from 'classnames'
import FeatherIcon from 'feather-icons-react'
import React from 'react'
import { Card } from 'react-bootstrap'

interface StatisticsProps {
     variant: string;
     icon: string;
     title: string
     descriptions: string
}

const Statistics = ( { variant, icon, title, descriptions }: StatisticsProps ) => {
     return (
          <React.Fragment>
               <Card
                    bg={ variant }
               >
                    <Card.Body>
                         <Card.Title>
                              <div
                                   className={
                                        classNames( 'd-flex align-items-center mb-3 text-white' )
                                   }
                              >
                                   <FeatherIcon
                                        icon={ icon }
                                        className={ classNames( 'me-2' ) }
                                   />
                                   { title }
                              </div>
                         </Card.Title>
                         <h2 className={ classNames( 'mb-0 text-white' ) }>
                              { descriptions }
                         </h2>
                    </Card.Body>
               </Card>
          </React.Fragment>
     )
}

export default Statistics