import React, { useState, useEffect, useRef } from 'react';
import { Table, Card } from 'react-bootstrap';
import { useTimesheetCalculations } from '../../../hooks/useTimesheetCalculations';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getISOWeekKey } from '../../../utils/date';

// component
import TimesheetTask from './TimesheetTask';
import TimesheetProject from './TimesheetProject';
import TimesheetDay from './TimesheetDay';
import TimesheetDeleteAction from './TimesheetDeleteAction';
import TimesheetAddAction from './TimesheetAddAction';
import PageTitle from 'components/PageTitle';
import { WeekNavigation } from '../../../components';
import classNames from 'classnames';

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

     const [ weekOffset, setWeekOffset ] = useState<number>( 0 ); // Always start with current week



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

     // Generate week key using consistent date-fns utils
     const getWeekKey = ( offset: number ) => getISOWeekKey( offset );

     // Removed: No localStorage clearing to persist data across week navigation
     useEffect( () => { }, [] );

     // FIXED Load Logic: LocalStorage first (instant persistence), Firestore sync (no override)
     useEffect( () => {
          if ( userId === 'anonymous' ) return;

          const weekKey = getWeekKey( weekOffset );
          const localStorageKey = `timesheet_${ userId }_${ weekKey }`;

          // STEP 1: Load localStorage IMMEDIATELY (preserves user edits)
          const localDataStr = localStorage.getItem( localStorageKey );
          let currentRows: Row[] = [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ];
          if ( localDataStr ) {
               try {
                    currentRows = JSON.parse( localDataStr ) as Row[];
               } catch ( e ) {
                    console.error( 'LocalStorage parse error:', e );
               }
          }
          setRows( currentRows );

          // STEP 2: Firestore background listener (sync, no setRows override)
          const docRef = doc( db, 'timesheets', userId, 'weeks', weekKey );
          const unsubscribe = onSnapshot( docRef, ( snap ) => {
               if ( snap.exists() ) {
                    const data = snap.data();
                    const fsRows = ( data.rows || [] ).map( ( r: any ) => ( {
                         ...r,
                         times: Object.keys( r.times || {} ).reduce( ( acc, day ) => {
                              const td = r.times[ day ];
                              acc[ day as keyof Row[ 'times' ] ] = typeof td === 'string' ? { time: td, description: '' } : td;
                              return acc;
                         }, {} as Record<string, { time: string; description: string }> ),
                         total: r.total || '00:00'
                    } ) ) as Row[];
                    // Sync Firestore to localStorage only (no UI override)
                    localStorage.setItem( localStorageKey, JSON.stringify( fsRows ) );
               }
          }, ( err ) => console.error( 'Firestore error:', err ) );

          return unsubscribe;
     }, [ userId, weekOffset ] );

     // Save rows only if meaningful data (prevent default row saves)
     useEffect( () => {
          if ( userId !== 'anonymous' && dataLoaded ) {
               const hasMeaningfulData = rows.some( row => row.project !== 'Select Project' || row.task || Object.values( row.times ).some( t => t.time && t.time !== '00:00' ) );
               if ( !hasMeaningfulData ) return;

               const weekKey = getWeekKey( weekOffset );
               const localStorageKey = `timesheet_${ userId }_${ weekKey }`;

               localStorage.setItem( localStorageKey, JSON.stringify( rows ) );

               const saveToFirestore = async () => {
                    const timesheetDocRef = doc( db, 'timesheets', userId, 'weeks', weekKey );
                    await setDoc( timesheetDocRef, { rows }, { merge: true } );
               };
               saveToFirestore().catch( console.error );
          }
     }, [ rows, userId, dataLoaded, weekOffset ] );

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
               <Card>
                    <Card.Body>
                         <div className="d-xl-flex justify-content-between mb-3">
                              <WeekNavigation
                                   weekOffset={ weekOffset }
                                   setWeekOffset={ setWeekOffset }
                                   className='mb-3 mb-xl-0'
                              />
                              <div className="d-flex justify-content-end">
                                   <TimesheetAddAction
                                        rows={ rows }
                                        setRows={ setRows }
                                   />
                              </div>
                         </div>
                         <Table
                              bordered
                              responsive
                         // variant='warning'
                         >
                              <thead>
                                   <tr>
                                        <th>PROJECT</th>
                                        <th>TASK</th>
                                        { days.map( ( day: string ) => (
                                             <th
                                                  key={ day }
                                                  className={
                                                       classNames(
                                                            'no-wrap',
                                                            { 'bg-warning': day === currentDay }
                                                       )
                                                  }
                                             >
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
