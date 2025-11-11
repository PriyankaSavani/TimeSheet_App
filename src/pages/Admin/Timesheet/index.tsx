import React, { useState, useEffect } from 'react';
import { Table, Button, Card } from 'react-bootstrap';
import FeatherIcon from 'feather-icons-react';
import { useTimesheetCalculations } from '../../../hooks/useTimesheetCalculations';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';


// component
import TimesheetTask from './TimesheetTask';
import TimesheetProject from './TimesheetProject';
import TimesheetDay from './TimesheetDay';
import TimesheetDeleteAction from './TimesheetDeleteAction';
import TimesheetAddAction from './TimesheetAddAction';
import TimesheetEditAction from './TimesheetEditAction';
import ExportToExcel from '../../../components/ExportToExcel';
import PageTitle from 'components/PageTitle';

export interface Row {
     id: string;
     project: string;
     task: string;
     times: Record<string, string>;
     total: string;
}

const Timesheet = () => {
     const [ userId, setUserId ] = useState<string>( 'anonymous' );

     const [ rows, setRows ] = useState<Row[]>( [] );

     const [ weekOffset, setWeekOffset ] = useState( 0 ); // New state for week navigation

     const [ editing, setEditing ] = useState<Record<string, 'all' | null>>( {} ); // Track editing state for each row

     const [ editingInputs, setEditingInputs ] = useState<Record<string, Record<string, string>>>( {} ); // Track raw input for editing

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

     // Generate week key based on weekOffset
     const getWeekKey = ( offset: number ) => {
          const today = new Date();
          const startOfWeek = new Date( today );
          const day = today.getDay();
          const diff = today.getDate() - day + ( day === 0 ? -6 : 1 ) + offset * 7;
          startOfWeek.setDate( diff );
          const year = startOfWeek.getFullYear();
          const weekNum = Math.ceil( ( ( startOfWeek.getTime() - new Date( year, 0, 1 ).getTime() ) / 86400000 + 1 ) / 7 );
          return `${ year }-W${ weekNum.toString().padStart( 2, '0' ) }`;
     };

     // Fetch rows from localStorage and Firestore (per-user per-week timesheet)
     useEffect( () => {
          const fetchRows = async () => {
               if ( userId !== 'anonymous' ) {
                    const weekKey = getWeekKey( weekOffset );
                    const localStorageKey = `timesheet_${ userId }_${ weekKey }`;

                    // First, load from localStorage
                    const localData = localStorage.getItem( localStorageKey );
                    if ( localData ) {
                         try {
                              const parsed = JSON.parse( localData );
                              setRows( parsed );
                         } catch ( error ) {
                              console.error( 'Error parsing localStorage data:', error );
                         }
                    }

                    // Then, fetch from Firestore and update if available
                    try {
                         const timesheetDocRef = doc( db, 'timesheets', userId, 'weeks', weekKey );
                         const docSnap = await getDoc( timesheetDocRef );
                         if ( docSnap.exists() ) {
                              const data = docSnap.data();
                              const firestoreRows = data.rows || [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ];
                              setRows( firestoreRows );
                              // Update localStorage with Firestore data
                              localStorage.setItem( localStorageKey, JSON.stringify( firestoreRows ) );
                         } else {
                              // If no Firestore data, use default and save to localStorage
                              const defaultRows = [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ];
                              setRows( defaultRows );
                              localStorage.setItem( localStorageKey, JSON.stringify( defaultRows ) );
                         }
                    } catch ( error ) {
                         console.error( 'Error fetching timesheet data:', error );
                         // If Firestore fails, keep localStorage data or default
                         if ( !localData ) {
                              const defaultRows = [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ];
                              setRows( defaultRows );
                              localStorage.setItem( localStorageKey, JSON.stringify( defaultRows ) );
                         }
                    }
               }
          };
          fetchRows();
     }, [ userId, weekOffset ] );

     // Save rows to localStorage and Firestore whenever rows change (per-user per-week timesheet)
     useEffect( () => {
          if ( userId !== 'anonymous' ) {
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
     }, [ rows, userId, weekOffset ] );

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

     const { days, weekDisplay, formatTimeInput, calculateRowTotal, dailyTotals, grandTotal } = useTimesheetCalculations( weekOffset, rows );

     const updateProject = ( id: string, project: string ) => {
          setRows( prev => prev.map( r => r.id === id ? { ...r, project, total: calculateRowTotal( r.times ) } : r ) );
     };

     const updateTask = ( id: string, task: string ) => {
          setRows( prev => prev.map( r => r.id === id ? { ...r, task, total: calculateRowTotal( r.times ) } : r ) );
     };

     const startEditingAll = ( id: string ) => {
          setEditing( prev => ( { ...prev, [ id ]: 'all' } ) );
          setEditingInputs( prev => ( {
               ...prev,
               [ id ]: {
                    project: rows.find( r => r.id === id )?.project || '',
                    task: rows.find( r => r.id === id )?.task || '',
                    ...rows.find( r => r.id === id )?.times
               }
          } ) );
     };

     const stopEditingAll = ( id: string ) => {
          setEditing( prev => ( { ...prev, [ id ]: null } ) );
          setEditingInputs( prev => {
               const newInputs = { ...prev };
               delete newInputs[ id ];
               return newInputs;
          } );
     };

     // Prepare data for Excel export
     const prepareExportData = () => {
          const data = [];
          // Header row (in uppercase)
          const header = [ 'DATE', 'PROJECT NAME', 'TASK DESCRIPTION', 'TOTAL HOURS' ];
          data.push( header );
          // Leave one blank row after header
          data.push( [] );

          // Calculate start of week for year
          const startOfWeek = new Date();
          const dayOfWeek = startOfWeek.getDay();
          const diff = startOfWeek.getDate() - dayOfWeek + ( dayOfWeek === 0 ? -6 : 1 ) + weekOffset * 7;
          startOfWeek.setDate( diff );
          const year = startOfWeek.getFullYear();

          // Data rows: for each day, list projects/tasks with hours on that day
          days.forEach( day => {
               rows.forEach( row => {
                    const hours = row.times[ day ] || '00:00';
                    if ( hours !== '00:00' ) {
                         // Format date as dd Mmm yyyy (e.g., 03 Nov 2025)
                         let formattedDate = day; // fallback
                         const parts = day.split( ', ' );
                         if ( parts.length > 1 ) {
                              const datePart = parts[ 1 ]; // e.g., "3 nov"
                              const dateSubParts = datePart.split( ' ' );
                              if ( dateSubParts.length >= 2 ) {
                                   const dd = dateSubParts[ 0 ].padStart( 2, '0' );
                                   const mmm = dateSubParts[ 1 ].charAt( 0 ).toUpperCase() + dateSubParts[ 1 ].slice( 1 ).toLowerCase();
                                   formattedDate = `${ dd } ${ mmm } ${ year }`;
                              }
                         }
                         data.push( [ formattedDate, row.project, row.task, hours ] );
                    }
               } );
          } );
          return data;
     };

     return (
          <React.Fragment>
               <PageTitle title={ 'Timesheet' } />
               <Card>
                    <Card.Body>
                         <div className="d-xl-flex justify-content-between mb-3">
                              <div className='d-flex mb-3 mb-xl-0'>
                                   <Button
                                        variant="primary"
                                        size='sm'
                                        onClick={ () => setWeekOffset( prev => prev - 1 ) }
                                   >
                                        <FeatherIcon icon='arrow-left-circle' className='me-2' />
                                        Previous
                                   </Button>
                                   <div className="border rounded align-self-center mx-3 p-1">
                                        { weekDisplay }
                                   </div>
                                   <Button
                                        variant="primary"
                                        size='sm'
                                        onClick={ () => setWeekOffset( prev => prev + 1 ) }
                                   >
                                        Next
                                        <FeatherIcon icon='arrow-right-circle' className='ms-2' />
                                   </Button>
                              </div>
                              <div className="d-flex">
                                   <ExportToExcel
                                        data={ prepareExportData() }
                                        filename={ `TimesheetOfAdmin_${ weekDisplay.replace( /[^a-zA-Z0-9]/g, '_' ) }.xlsx` }
                                        sheetName="Timesheet"
                                        buttonText="Export to Excel"
                                   />
                                   <TimesheetAddAction
                                        rows={ rows }
                                        setRows={ setRows }
                                   />
                              </div>
                         </div>
                         <Table
                              bordered responsive
                         >
                              <thead>
                                   <tr>
                                        <th>PROJECT</th>
                                        <th>TASK</th>
                                        { days.map( ( day: string ) => (
                                             <th key={ day }>
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
                                                       isEditing={ editing[ row.id ] === 'all' }
                                                       editingInputs={ editingInputs }
                                                       setEditingInputs={ setEditingInputs }
                                                       updateProject={ updateProject }
                                                  />
                                             </td>
                                             <td>
                                                  <TimesheetTask
                                                       rowId={ row.id }
                                                       value={ row.task }
                                                       isEditing={ editing[ row.id ] === 'all' }
                                                       editingInputs={ editingInputs }
                                                       setEditingInputs={ setEditingInputs }
                                                       updateTask={ updateTask }
                                                  />
                                             </td>
                                             { days.map( ( day: string ) => (
                                                  <td key={ day }>
                                                       <TimesheetDay
                                                            row={ row }
                                                            setRows={ setRows }
                                                            day={ day }
                                                            isEditing={ editing[ row.id ] === 'all' }
                                                            editingInputs={ editingInputs }
                                                            setEditingInputs={ setEditingInputs }
                                                            formatTimeInput={ formatTimeInput }
                                                            calculateRowTotal={ calculateRowTotal }
                                                       />
                                                  </td>
                                             ) ) }
                                             <td>
                                                  { calculateRowTotal( row.times ) }
                                             </td>
                                             <td>
                                                  <div className="d-flex">
                                                       <TimesheetEditAction
                                                            onEdit={ () => {
                                                                 if ( editing[ row.id ] === 'all' ) {
                                                                      stopEditingAll( row.id );
                                                                 } else {
                                                                      startEditingAll( row.id );
                                                                 }
                                                            } }
                                                            isEditing={ editing[ row.id ] === 'all' }
                                                       />
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
                                        <td colSpan={ 2 }>
                                             <strong>TOTAL</strong>
                                        </td>
                                        { days.map( ( day: string ) => (
                                             <td key={ day }>
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
