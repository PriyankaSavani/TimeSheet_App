import classNames from 'classnames'
import FeatherIcon from 'feather-icons-react'
import React, { useEffect, useState } from 'react'
import { Card, Table } from 'react-bootstrap'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../../config/firebase'

interface EmployeeListProps {
     id: string
     fullname: string
     email: string
     role: string
     assignedProject?: string
}

interface ProjectProps {
     id: string
     projectName: string
     assignEmployee: string[]
}

const EmployeeList = () => {
     const [ employees, setEmployees ] = useState<EmployeeListProps[]>( [] )
     const [ loading, setLoading ] = useState( true )

     useEffect( () => {
          const fetchData = async () => {
               try {
                    // Fetch employees
                    const empQ = query( collection( db, 'users' ), where( 'role', 'in', [ 'user', 'admin' ] ) )
                    const empSnapshot = await getDocs( empQ )
                    const empList: EmployeeListProps[] = empSnapshot.docs.map( doc => ( {
                         id: doc.id,
                         ...doc.data()
                    } as EmployeeListProps ) )

                    // Fetch projects
                    const projSnapshot = await getDocs( collection( db, 'projects' ) )
                    const projList: ProjectProps[] = projSnapshot.docs.map( doc => ( {
                         id: doc.id,
                         ...doc.data()
                    } as ProjectProps ) )

                    // Assign projects to employees (multiple projects possible)
                    const employeesWithProjects = empList.map( emp => {
                         const assignedProjs = projList.filter( proj => proj.assignEmployee.includes( emp.fullname ) )
                         const projectNames = assignedProjs.length > 0 ? assignedProjs.map( p => p.projectName ).join( ', ' ) : 'N/A'
                         return {
                              ...emp,
                              assignedProject: projectNames
                         }
                    } )
                    setEmployees( employeesWithProjects )
               } catch ( error ) {
                    console.error( 'Error fetching data:', error )
               } finally {
                    setLoading( false )
               }
          }
          fetchData()
     }, [] )

     return (
          <React.Fragment>
               <Card>
                    <Card.Body>
                         <Card.Title
                              className={
                                   classNames( 'd-flex align-items-center justify-content-between' )
                              }
                         >
                              Employee List
                              <FeatherIcon
                                   icon='more-vertical'
                                   className={ classNames( 'cursor-pointer' ) }
                              />
                         </Card.Title>
                         <Table>
                              <thead>
                                   <tr>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th>Email</th>
                                        <th>Assigned Project Name</th>
                                   </tr>
                              </thead>
                              <tbody>
                                   { loading ? (
                                        <tr>
                                             <td colSpan={ 5 }>Loading...</td>
                                        </tr>
                                   ) : employees.length === 0 ? (
                                        <tr>
                                             <td colSpan={ 5 }>No employees found</td>
                                        </tr>
                                   ) : (
                                        employees.map( emp => (
                                             <tr key={ emp.id }>
                                                  <td>{ emp.fullname || 'N/A' }</td>
                                                  <td>{ emp.role || 'N/A' }</td>
                                                  <td>{ emp.email || 'N/A' }</td>
                                                  <td>{ emp.assignedProject || 'N/A' }</td>
                                             </tr>
                                        ) )
                                   ) }
                              </tbody>
                         </Table>
                    </Card.Body>
               </Card>
          </React.Fragment>
     )
}

export default EmployeeList
