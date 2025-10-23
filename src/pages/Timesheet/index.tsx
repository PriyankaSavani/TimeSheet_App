import React, { useState, useEffect } from 'react';
import { Table, Button } from 'react-bootstrap';
import classNames from 'classnames';
import FeatherIcon from 'feather-icons-react';
import { useTimesheetCalculations } from '../../hooks/useTimesheetCalculations';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';


// component
import TimesheetTask from './TimesheetTask';
import TimesheetProject from './TimesheetProject';
import TimesheetDay from './TimesheetDay';
import TimesheetDeleteAction from './TimesheetDeleteAction';
import TimesheetAddAction from './TimesheetAddAction';
import TimesheetEditAction from './TimesheetEditAction';
import ExportToExcel from '../../components/ExportToExcel';
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

     // Fetch rows from Firestore (per-user timesheet)
     useEffect( () => {
          const fetchRows = async () => {
               if ( userId !== 'anonymous' ) {
                    try {
                         const timesheetDocRef = doc( db, 'timesheets', userId );
                         const docSnap = await getDoc( timesheetDocRef );
                         if ( docSnap.exists() ) {
                              const data = docSnap.data();
                              setRows( data.rows || [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ] );
                         } else {
                              setRows( [ { id: '1', project: 'Select Project', task: '', times: {}, total: '00:00' } ] );
                         }
                    } catch ( error ) {
                         console.error( 'Error fetching timesheet data:', error );
                    }
               }
          };
          fetchRows();
     }, [ userId ] );

     // Save rows to Firestore whenever rows change (per-user timesheet)
     useEffect( () => {
          const saveRows = async () => {
               if ( userId !== 'anonymous' && rows.length > 0 ) {
                    try {
                         const timesheetDocRef = doc( db, 'timesheets', userId );
                         await setDoc( timesheetDocRef, { rows }, { merge: true } );
                    } catch ( error ) {
                         console.error( 'Error saving timesheet data:', error );
                    }
               }
          };
          saveRows();
     }, [ rows, userId ] );

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
          // Header row
          const header = [ 'Project', 'Task', ...days, 'Total Hours' ];
          data.push( header );
          // Data rows
          rows.forEach( row => {
               const rowData = [ row.project, row.task ];
               days.forEach( day => {
                    rowData.push( row.times[ day ] || '00:00' );
               } );
               rowData.push( row.total );
               data.push( rowData );
          } );
          // Empty row
          data.push( [] );
          // Totals row
          const totalsRow = [ 'TOTAL', '', ...days.map( day => dailyTotals[ day ] ), grandTotal ];
          data.push( totalsRow );
          return data;
     };

     return (
          <React.Fragment>
               <PageTitle title={ 'Timesheet' } />
               <div className="d-flex justify-content-between mb-3">
                    <div className='d-flex'>
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
                              filename={ `Timesheet_${ weekDisplay.replace( /[^a-zA-Z0-9]/g, '_' ) }.xlsx` }
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
                                   <td className={ classNames( 'd-flex' ) }>
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
          </React.Fragment >
     )
}

export default Timesheet
