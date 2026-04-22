import React, { useState, useEffect, useRef } from 'react';
import { Table, Card } from 'react-bootstrap';
import { useTimesheetCalculations } from '../../../hooks/useTimesheetCalculations';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getISOWeekKey } from '../../../utils/date';

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
     const [ weekOffset, setWeekOffset ] = useState<number>( 0 );
     const unsubscribeRef = useRef<( () => void ) | null>( null );

     // Listen to auth state changes
     useEffect( () => {
          const unsubscribe = onAuthStateChanged( auth, ( user ) => {
               if ( user ) {
                    setUserId( user.uid );
               } else {
                    setUserId( 'anonymous' );
               }
          } );
          return unsubscribe;
     }, [] );

     const getWeekKey = ( offset: number ) => getISOWeekKey( offset );

     // Realtime listener: SET rows from Firestore (single source of truth)
     useEffect( () => {
          if ( userId === 'anonymous' ) return;

          const weekKey = getWeekKey( weekOffset );
          const docRef = doc( db, 'timesheets', userId, 'weeks', weekKey );

          const unsubscribe = onSnapshot( docRef, ( snap ) => {
               if ( snap.exists() ) {
                    const data = snap.data();
                    const fsRows = ( data.rows || [] ) as Row[];
                    // Normalize times if needed
                    const normalizedRows = fsRows.map( r => ( {
                         ...r,
                         times: Object.keys( r.times || {} ).reduce( ( acc, day ) => {
                              const td = r.times[ day ];
                              acc[ day as keyof Row[ 'times' ] ] = typeof td === 'string' ? { time: td, description: '' } : td;
                              return acc;
                         }, {} as Record<string, { time: string; description: string }> ),
                    } ) );
                    setRows( normalizedRows.length > 0 ? normalizedRows : [ { id: 'default', project: 'Select Project', task: '', times: {}, total: '00:00' } ] );
               } else {
                    // No doc: empty/default
                    setRows( [ { id: 'default', project: 'Select Project', task: '', times: {}, total: '00:00' } ] );
               }
          }, ( err ) => console.error( 'Firestore listener error:', err ) );

          unsubscribeRef.current = unsubscribe;

          return () => {
               unsubscribeRef.current && unsubscribeRef.current();
          };
     }, [ userId, weekOffset ] );

     // updateRows: Optimistic UI + Firestore sync
     const updateRows = async ( newRows: Row[] ) => {
          setRows( newRows );
          if ( userId === 'anonymous' ) return;

          const weekKey = getWeekKey( weekOffset );
          const docRef = doc( db, 'timesheets', userId, 'weeks', weekKey );
          try {
               await setDoc( docRef, { rows: newRows }, { merge: true } );
          } catch ( error ) {
               console.error( 'Firestore save error:', error );
               // Revert on error
               setRows( rows );
          }
     };

     const { days, currentDay, formatTimeInput, calculateRowTotal, dailyTotals, grandTotal } = useTimesheetCalculations( weekOffset, rows );

     const updateProject = async ( id: string, project: string ) => {
          const newRows = rows.map( r => r.id === id ? { ...r, project, total: calculateRowTotal( r.times, days ) } : r );
          await updateRows( newRows );
     };

     const updateTask = async ( id: string, task: string ) => {
          const newRows = rows.map( r => r.id === id ? { ...r, task, total: calculateRowTotal( r.times, days ) } : r );
          await updateRows( newRows );
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
                                   <TimesheetAddAction rows={ rows } updateRows={ updateRows } />
                              </div>
                         </div>
                         <Table bordered responsive>
                              <thead>
                                   <tr>
                                        <th>PROJECT</th>
                                        <th>TASK</th>
                                        { days.map( ( day: string ) => (
                                             <th key={ day } className={ classNames( 'no-wrap', { 'bg-warning': day === currentDay } ) }>
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
                                                            updateRows={ updateRows }
                                                            day={ day }
                                                            isEditing={ false }
                                                            editingInputs={ {} }
                                                            setEditingInputs={ () => { } }
                                                            formatTimeInput={ formatTimeInput }
                                                            calculateRowTotal={ calculateRowTotal }
                                                            days={ days }
                                                            rows={ rows }
                                                       />
                                                  </td>
                                             ) ) }
                                             <td>{ calculateRowTotal( row.times, days ) }</td>
                                             <td>
                                                  <div className="d-flex">
                                                       <TimesheetDeleteAction
                                                            rowId={ row.id }
                                                            updateRows={ updateRows }
                                                            rows={ rows }
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
                                                  <strong>{ dailyTotals[ day ] }</strong>
                                             </td>
                                        ) ) }
                                        <td><strong>{ grandTotal }</strong></td>
                                        <td></td>
                                   </tr>
                              </tbody>
                         </Table>
                    </Card.Body>
               </Card>
          </React.Fragment>
     )
}

export default Timesheet

