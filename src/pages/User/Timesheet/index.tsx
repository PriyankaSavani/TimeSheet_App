import React, { useState, useEffect } from 'react';
import { Table, Card, Alert, Spinner } from 'react-bootstrap';
import { useTimesheetCalculations } from '../../../hooks/useTimesheetCalculations';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// component
import TimesheetTask from './TimesheetTask';
import TimesheetProject from './TimesheetProject';
import TimesheetDay from './TimesheetDay';
import TimesheetDeleteAction from './TimesheetDeleteAction';
import TimesheetAddAction from './TimesheetAddAction';
import PageTitle from 'components/PageTitle';
import { WeekNavigation } from '../../../components';

export interface Row {
     id: string;
     project: string;
     task: string;
     times: Record<string, { time: string, description: string }>;
     total: string;
}

const Timesheet = () => {
     const [ userId, setUserId ] = useState<string>( 'anonymous' );

     const [ rows, setRows ] = useState<Row[]>( [] );

     const [ weekOffset, setWeekOffset ] = useState( () => {
          const saved = localStorage.getItem( 'timesheet_weekOffset' );
          return saved ? parseInt( saved, 10 ) : 0;
     } ); // New state for week navigation

     // Save weekOffset to localStorage whenever it changes
     useEffect( () => {
          localStorage.setItem( 'timesheet_weekOffset', weekOffset.toString() );
     }, [ weekOffset ] );

     const [ loading, setLoading ] = useState<boolean>( true );

     const [ error, setError ] = useState<string | null>( null );

     const [ dataLoaded, setDataLoaded ] = useState<boolean>( false );

     // Listen to auth state changes
     useEffect( () => {
          const unsubscribe = onAuthStateChanged( auth, ( user ) => {
               if ( user ) {
                    setUserId( user.uid );
               } else {
                    setUserId( 'anonymous' );
               }
          } );

          return () => unsubscribe();
     }, [] );

     // Generate week key based on weekOffset using UTC time for consistency across timezones
     const getWeekKey = ( offset: number ) => {
          const today = new Date();
          const startOfWeek = new Date( Date.UTC( today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() ) );
          const day = today.getUTCDay();
          const diff = today.getUTCDate() - day + ( day === 0 ? -6 : 1 ) + offset * 7;
          startOfWeek.setUTCDate( diff );
          const year = startOfWeek.getUTCFullYear();
          const weekNum = Math.ceil( ( ( startOfWeek.getTime() - new Date( Date.UTC( year, 0, 1 ) ).getTime() ) / 86400000 + 1 ) / 7 );
          return `${ year }-W${ weekNum.toString().padStart( 2, '0' ) }`;
     };

     // Generate week key based on local time (for backward compatibility)
     const getLocalWeekKey = ( offset: number ) => {
          const today = new Date();
          const startOfWeek = new Date( today );
          const day = today.getDay();
          const diff = today.getDate() - day + ( day === 0 ? -6 : 1 ) + offset * 7;
          startOfWeek.setDate( diff );
          const year = startOfWeek.getFullYear();
          const weekNum = Math.ceil( ( ( startOfWeek.getTime() - new Date( year, 0, 1 ).getTime() ) / 86400000 + 1 ) / 7 );
          return `${ year }-W${ weekNum.toString().padStart( 2, '0' ) }`;
     };

     // Set up real-time listener for Firestore data (per-user per-week timesheet)
     useEffect( () => {
          if ( userId === 'anonymous' ) {
               setLoading( false );
               setDataLoaded( true );
               return;
          }

          setLoading( true );
          setError( null );
          setDataLoaded( false );

          const weekKey = getWeekKey( weekOffset );
          const localStorageKey = `timesheet_${ userId }_${ weekKey }`;

          // First, try to fetch from Firestore using UTC week key
          let timesheetDocRef = doc( db, 'timesheets', userId, 'weeks', weekKey );

          // Check if data exists with UTC key, if not, try local key
          const checkDocExists = async () => {
               let docSnap = await getDoc( timesheetDocRef );
               if ( !docSnap.exists() ) {
                    const localWeekKey = getLocalWeekKey( weekOffset );
                    timesheetDocRef = doc( db, 'timesheets', userId, 'weeks', localWeekKey );
                    docSnap = await getDoc( timesheetDocRef );
               }
               return docSnap.exists();
          };

          checkDocExists().then( ( exists ) => {
               if ( exists ) {
                    // Set up real-time listener
                    const unsubscribe = onSnapshot( timesheetDocRef, ( docSnap ) => {
                         if ( docSnap.exists() ) {
                              const data = docSnap.data();
                              const firestoreRows = data.rows || [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ];
                              // Ensure times structure is correct
                              const correctedRows = firestoreRows.map( ( row: any ) => ( {
                                   ...row,
                                   times: Object.keys( row.times || {} ).reduce( ( acc: Record<string, { time: string, description: string }>, day ) => {
                                        const timeData = row.times[ day ];
                                        if ( typeof timeData === 'string' ) {
                                             acc[ day ] = { time: timeData, description: '' };
                                        } else {
                                             acc[ day ] = timeData;
                                        }
                                        return acc;
                                   }, {} )
                              } ) );
                              setRows( correctedRows );
                              // Update localStorage with Firestore data
                              localStorage.setItem( localStorageKey, JSON.stringify( correctedRows ) );
                         } else {
                              // If no Firestore data, check localStorage
                              const localData = localStorage.getItem( localStorageKey );
                              if ( localData ) {
                                   try {
                                        const parsed = JSON.parse( localData );
                                        setRows( parsed );
                                   } catch ( parseError ) {
                                        console.error( 'Error parsing localStorage data:', parseError );
                                        const defaultRows = [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ];
                                        setRows( defaultRows );
                                        localStorage.setItem( localStorageKey, JSON.stringify( defaultRows ) );
                                   }
                              } else {
                                   // Use default and save to localStorage
                                   const defaultRows = [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ];
                                   setRows( defaultRows );
                                   localStorage.setItem( localStorageKey, JSON.stringify( defaultRows ) );
                              }
                         }
                         setLoading( false );
                         setDataLoaded( true );
                    }, ( error ) => {
                         console.error( 'Error listening to timesheet data from Firestore:', error );
                         setError( 'Failed to load timesheet data. Please check your connection.' );
                         // Fallback to localStorage
                         const localData = localStorage.getItem( localStorageKey );
                         if ( localData ) {
                              try {
                                   const parsed = JSON.parse( localData );
                                   setRows( parsed );
                              } catch ( parseError ) {
                                   console.error( 'Error parsing localStorage data:', parseError );
                                   const defaultRows = [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ];
                                   setRows( defaultRows );
                                   localStorage.setItem( localStorageKey, JSON.stringify( defaultRows ) );
                              }
                         } else {
                              const defaultRows = [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ];
                              setRows( defaultRows );
                              localStorage.setItem( localStorageKey, JSON.stringify( defaultRows ) );
                         }
                         setLoading( false );
                         setDataLoaded( true );
                    } );

                    return unsubscribe;
               } else {
                    // No Firestore data, use localStorage
                    const localData = localStorage.getItem( localStorageKey );
                    if ( localData ) {
                         try {
                              const parsed = JSON.parse( localData );
                              setRows( parsed );
                         } catch ( parseError ) {
                              console.error( 'Error parsing localStorage data:', parseError );
                              const defaultRows = [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ];
                              setRows( defaultRows );
                              localStorage.setItem( localStorageKey, JSON.stringify( defaultRows ) );
                         }
                    } else {
                         // Use default and save to localStorage
                         const defaultRows = [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ];
                         setRows( defaultRows );
                         localStorage.setItem( localStorageKey, JSON.stringify( defaultRows ) );
                    }
                    setLoading( false );
                    setDataLoaded( true );
               }
          } ).catch( ( error ) => {
               console.error( 'Error checking document existence:', error );
               setError( 'Failed to load timesheet data. Please check your connection.' );
               // Fallback to localStorage
               const localData = localStorage.getItem( localStorageKey );
               if ( localData ) {
                    try {
                         const parsed = JSON.parse( localData );
                         setRows( parsed );
                    } catch ( parseError ) {
                         console.error( 'Error parsing localStorage data:', parseError );
                         const defaultRows = [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ];
                         setRows( defaultRows );
                         localStorage.setItem( localStorageKey, JSON.stringify( defaultRows ) );
                    }
               } else {
                    const defaultRows = [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ];
                    setRows( defaultRows );
                    localStorage.setItem( localStorageKey, JSON.stringify( defaultRows ) );
               }
               setLoading( false );
               setDataLoaded( true );
          } );
     }, [ userId, weekOffset ] );

     // Save rows to localStorage and Firestore whenever rows change (per-user per-week timesheet)
     useEffect( () => {
          if ( userId !== 'anonymous' && dataLoaded ) {
               const weekKey = getWeekKey( weekOffset );
               const localStorageKey = `timesheet_${ userId }_${ weekKey }`;

               // Save to localStorage immediately
               localStorage.setItem( localStorageKey, JSON.stringify( rows ) );

               // Save to Firestore asynchronously
               const saveToFirestore = async () => {
                    if ( rows.length > 0 ) {
                         try {
                              const timesheetDocRef = doc( db, 'timesheets', userId, 'weeks', weekKey );
                              await setDoc( timesheetDocRef, { rows }, { merge: true } );
                         } catch ( error ) {
                              console.error( 'Error saving timesheet data to Firestore:', error );
                         }
                    }
               };
               saveToFirestore();
          }
     }, [ rows, userId, weekOffset, dataLoaded ] );

     // Save data on page unload to prevent data loss
     useEffect( () => {
          const handleBeforeUnload = ( event: BeforeUnloadEvent ) => {
               if ( userId !== 'anonymous' && rows.length > 0 ) {
                    const weekKey = getWeekKey( weekOffset );
                    const timesheetDocRef = doc( db, 'timesheets', userId, 'weeks', weekKey );
                    // Attempt to save synchronously (though setDoc is async, this ensures it's triggered)
                    setDoc( timesheetDocRef, { rows }, { merge: true } ).catch( ( error ) => {
                         console.error( 'Error saving on unload:', error );
                    } );
               }
          };

          window.addEventListener( 'beforeunload', handleBeforeUnload );

          return () => {
               window.removeEventListener( 'beforeunload', handleBeforeUnload );
          };
     }, [ rows, userId, weekOffset ] );

     const { days, currentDay, formatTimeInput, calculateRowTotal, dailyTotals, grandTotal } = useTimesheetCalculations( weekOffset, rows );

     const updateProject = ( id: string, project: string ) => {
          setRows( prev => prev.map( r => r.id === id ? { ...r, project, total: calculateRowTotal( r.times, days ) } : r ) );
     };

     const updateTask = ( id: string, task: string ) => {
          setRows( prev => prev.map( r => r.id === id ? { ...r, task, total: calculateRowTotal( r.times, days ) } : r ) );
     };



     return (
          <React.Fragment>
               <PageTitle title={ 'Timesheet' } />
               { loading && (
                    <div className="text-center my-4">
                         <Spinner animation="border" role="status">
                              <span className="visually-hidden">Loading...</span>
                         </Spinner>
                         <p>Loading timesheet data...</p>
                    </div>
               ) }
               { error && (
                    <Alert variant="danger" className="my-3">
                         { error }
                    </Alert>
               ) }
               <Card>
                    <Card.Body>
                         <div className="d-xl-flex justify-content-between mb-3">
                              <WeekNavigation
                                   weekOffset={ weekOffset }
                                   setWeekOffset={ setWeekOffset }
                                   localStorageKey="timesheet_weekOffset"
                                   className='mb-3 mb-xl-0'
                              />
                              <div className="d-flex">
                                   <TimesheetAddAction
                                        rows={ rows }
                                        setRows={ setRows }
                                   />
                              </div>
                         </div>
                         <Table
                              bordered
                              responsive
                              variant='warning'
                         >
                              <thead>
                                   <tr>
                                        <th>PROJECT</th>
                                        <th>TASK</th>
                                        { days.map( ( day: string ) => (
                                             <th key={ day } className={ day === currentDay ? 'bg-warning' : '' }>
                                                  { day }
                                             </th>
                                        ) ) }
                                        <th>TOTAL HOURS</th>
                                        <th>ACTION</th>
                                   </tr>
                              </thead>
                              <tbody>
                                   { rows.map( row => (
                                        <tr key={ row.id }>
                                             <td>
                                                  <TimesheetProject
                                                       rowId={ row.id }
                                                       value={ row.project }
                                                       isEditing={ false }
                                                       editingInputs={ {} }
                                                       setEditingInputs={ () => { } }
                                                       updateProject={ updateProject }
                                                  />
                                             </td>
                                             <td>
                                                  <TimesheetTask
                                                       rowId={ row.id }
                                                       value={ row.task }
                                                       isEditing={ false }
                                                       editingInputs={ {} }
                                                       setEditingInputs={ () => { } }
                                                       updateTask={ updateTask }
                                                       selectedProject={ row.project }
                                                  />
                                             </td>
                                             { days.map( ( day: string ) => (
                                                  <td key={ day } className={ day === currentDay ? 'bg-warning' : '' }>
                                                       <TimesheetDay
                                                            row={ row }
                                                            setRows={ setRows }
                                                            day={ day }
                                                            isEditing={ false }
                                                            editingInputs={ {} }
                                                            setEditingInputs={ () => { } }
                                                            formatTimeInput={ formatTimeInput }
                                                            calculateRowTotal={ calculateRowTotal }
                                                            days={ days }
                                                       />
                                                  </td>
                                             ) ) }
                                             <td>
                                                  { calculateRowTotal( row.times, days ) }
                                             </td>
                                             <td>
                                                  <div className="d-flex">
                                                       <TimesheetDeleteAction
                                                            rowId={ row.id }
                                                            onDelete={ () => { } }
                                                            rows={ rows }
                                                            setRows={ setRows }
                                                       />
                                                  </div>
                                             </td>
                                        </tr>
                                   ) ) }
                                   <tr>
                                        <td colSpan={ 2 } className={ 'text-center' }>
                                             <strong>TOTAL</strong>
                                        </td>
                                        { days.map( ( day: string ) => (
                                             <td key={ day } className={ day === currentDay ? 'bg-warning' : '' }>
                                                  <strong>
                                                       { dailyTotals[ day ] }
                                                  </strong>
                                             </td>
                                        ) ) }
                                        <td>
                                             <strong>{ grandTotal }</strong>
                                        </td>
                                        <td></td>
                                   </tr>
                              </tbody>
                         </Table >
                    </Card.Body>
               </Card>
          </React.Fragment >
     )
}

export default Timesheet
