import React, { useState, useEffect } from 'react';
import { Card, Spinner, Table } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import PageTitle from '../../../components/PageTitle';
import { selectAuthState } from '../../../redux/auth/selectors';

const MyAccount = () => {
     const { user } = useSelector( selectAuthState );
     const [ loading, setLoading ] = useState( true );
     const [ userData, setUserData ] = useState<any>( null );
     const [ assignedProjects, setAssignedProjects ] = useState<string[]>( [] );

     useEffect( () => {
          const fetchData = async () => {
               if ( !user?.id ) {
                    setLoading( false );
                    return;
               }

               try {
                    setLoading( true );

                    // Fetch user data
                    const userDoc = await getDoc( doc( db, 'users', user.id ) );
                    if ( userDoc.exists() ) {
                         setUserData( userDoc.data() );
                    }

                    // Fetch all projects and filter assigned to this user
                    const projectsSnapshot = await getDocs( collection( db, 'projects' ) );
                    const projectsList = projectsSnapshot.docs.map( doc => ( {
                         id: doc.id,
                         ...doc.data()
                    } as any ) );

                    const fullname = ( ( userData?.firstName || user?.firstName || '' ) + ' ' + ( userData?.lastName || user?.lastName || '' ) ).trim();
                    if ( fullname ) {
                         const userAssignedProjects = projectsList.filter( ( proj: any ) =>
                              proj.assignEmployee && proj.assignEmployee.includes( fullname )
                         ).map( ( proj: any ) => proj.projectName );

                         setAssignedProjects( userAssignedProjects );
                    }
               } catch ( err ) {
                    console.error( 'Error fetching data:', err );
               } finally {
                    setLoading( false );
               }
          };
          fetchData();
     }, [ user?.id, userData?.firstName, userData?.lastName, user?.firstName, user?.lastName ] );

     if ( loading ) {
          return (
               <div className="text-center my-4">
                    <Spinner animation="border" />
               </div>
          );
     }

     return (
          <React.Fragment>
               <PageTitle title="My Account" />
               <Card>
                    <Card.Body>
                         <h4 className="card-title mb-3">Profile Information</h4>
                         <Table responsive className="mb-0">
                              <tbody>
                                   <tr>
                                        <td>First Name:</td>
                                        <td>{ userData?.firstName || user?.firstName || 'N/A' }</td>
                                   </tr>
                                   <tr>
                                        <td>Last Name:</td>
                                        <td>{ userData?.lastName || user?.lastName || 'N/A' }</td>
                                   </tr>
                                   <tr>
                                        <td>Email Id:</td>
                                        <td>{ user?.username || 'N/A' }</td>
                                   </tr>
                                   <tr>
                                        <td>Role:</td>
                                        <td>
                                             <span className={ `badge bg-${ user?.role === 'admin' ? 'danger' : 'primary' }` }>
                                                  { user?.role || 'user' }
                                             </span>
                                        </td>
                                   </tr>
                                   <tr>
                                        <td>Assign Project Name:</td>
                                        <td>{ assignedProjects.length > 0 ? assignedProjects.map( p => <div key={ p }>{ p }</div> ) : 'N/A' }</td>
                                   </tr>
                              </tbody>
                         </Table>
                    </Card.Body>
               </Card>
          </React.Fragment>
     );
};

export default MyAccount;
