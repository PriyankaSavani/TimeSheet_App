import React, { useState, useEffect } from 'react'
import { Card, Col, Row, Table } from 'react-bootstrap'
import { collection, updateDoc, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '../../../config/firebase'
import { useSelector } from 'react-redux'
import { selectAuthState } from '../../../redux/auth/selectors'
import PageTitle from '../../../components/PageTitle'
import UsersAddAction from './UsersAddAction'
import UsersEditAction from './UsersEditAction'
import UsersDeleteAction from './UsersDeleteAction'


interface User {
     id: string;
     fullname: string;
     email: string;
     role: string;
}

const Users = () => {
     const [ users, setUsers ] = useState<User[]>( [] );
     const { user: currentUser } = useSelector( selectAuthState );

     useEffect( () => {
          // Set up real-time listener for users
          const usersCollection = collection( db, 'users' );
          const unsubscribeUsers = onSnapshot( usersCollection, ( snapshot ) => {
               const usersList = snapshot.docs.map( doc => ( {
                    id: doc.id,
                    ...doc.data()
               } ) as User );
               setUsers( usersList );
          }, ( error ) => {
               console.error( 'Error listening to users:', error );
          } );

          // Cleanup function to unsubscribe from the listener
          return () => {
               unsubscribeUsers();
          };
     }, [] );

     const addUser = async ( user: { fullname: string; email: string; role: string; password: string } ) => {
          try {
               // Create user in Firebase Auth
               const userCredential = await createUserWithEmailAndPassword( auth, user.email, user.password );
               const uid = userCredential.user.uid;

               // Set user data in Firestore
               await setDoc( doc( db, 'users', uid ), {
                    email: user.email,
                    fullname: user.fullname,
                    role: user.role,
               } );
          } catch ( error ) {
               console.error( 'Error adding user:', error );
          }
     };

     const updateUser = async ( id: string, user: { fullname: string; email: string; role: string } ) => {
          try {
               await updateDoc( doc( db, 'users', id ), user );
          } catch ( error ) {
               console.error( 'Error updating user:', error );
          }
     };

     const deleteUser = async ( id: string ) => {
          try {
               await deleteDoc( doc( db, 'users', id ) );
          } catch ( error ) {
               console.error( 'Error deleting user:', error );
          }
     };



     // Only allow admin to access this page
     if ( currentUser?.role !== 'admin' ) {
          return <div>You do not have permission to access this page.</div>;
     }

     return (
          <React.Fragment>
               <PageTitle title={ 'Users Management' } />

               <Row>
                    <Col>
                         <Card>
                              <Card.Body>
                                   <div className="d-flex justify-content-end mb-3">
                                        <UsersAddAction addUser={ addUser } />
                                   </div>

                                   <Table responsive bordered>
                                        <thead>
                                             <tr>
                                                  <th>Full Name</th>
                                                  <th>Email</th>
                                                  <th>Role</th>
                                                  <th>Action</th>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             { users.map( ( user ) => (
                                                  <tr key={ user.id }>
                                                       <td>{ user.fullname }</td>
                                                       <td>{ user.email }</td>
                                                       <td>{ user.role }</td>
                                                       <td>
                                                            <UsersEditAction updateUser={ updateUser } user={ user } />
                                                            <UsersDeleteAction deleteUser={ deleteUser } user={ user } />
                                                       </td>
                                                  </tr>
                                             ) ) }
                                        </tbody>
                                   </Table>
                              </Card.Body>
                         </Card>
                    </Col>
               </Row>
          </React.Fragment >
     )
}

export default Users
