import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Table, Button } from 'react-bootstrap';
import classNames from 'classnames';
import { APICore } from '../../helpers/api/apiCore';

// component
import TimesheetTask from './TimesheetTask';
import TimesheetProject from './TimesheetProject';
import TimesheetDay from './TimesheetDay';
import TimesheetDeleteAction from './TimesheetDeleteAction';
import TimesheetAddAction from './TimesheetAddAction';
import FeatherIcon from 'feather-icons-react';

export interface Row {
     id: number;
     project: string;
     task: string;
     times: Record<string, string>;
     total: string;
}

const Timesheet = () => {
     const api = new APICore();
     const user = api.getLoggedInUser();
     const userId = user ? user.id : 'anonymous';

     const [ rows, setRows ] = useState<Row[]>( () => {
          const savedRows = localStorage.getItem( `timesheet-rows-${ userId }` );
          return savedRows ? JSON.parse( savedRows ) : [ { id: 1, project: 'Select Project', task: '', times: {}, total: '00:00' } ];
     } );

     const [ weekOffset, setWeekOffset ] = useState( 0 ); // New state for week navigation

     // Save rows to localStorage whenever rows change, keyed by user ID
     useEffect( () => {
          localStorage.setItem( `timesheet-rows-${ userId }`, JSON.stringify( rows ) );
     }, [ rows, userId ] );

     const { days, weekDisplay } = useMemo( () => {
          const today = new Date();
          const startOfWeek = new Date( today.setDate( today.getDate() - today.getDay() + 1 + weekOffset * 7 ) ); // Adjust for week offset
          const endOfWeek = new Date( startOfWeek );
          endOfWeek.setDate( startOfWeek.getDate() + 6 );
          const weekDays = [];
          for ( let i = 0; i < 7; i++ ) {
               const date = new Date( startOfWeek );
               date.setDate( startOfWeek.getDate() + i );
               const dayName = date.toLocaleDateString( 'en-US', { weekday: 'short' } );
               const monthName = date.toLocaleDateString( 'en-US', { month: 'short' } );
               const dayNum = date.getDate();
               weekDays.push( `${ dayName }, ${ dayNum } ${ monthName }` );
          }
          const startStr = startOfWeek.toLocaleDateString( 'en-US', { day: 'numeric', month: 'short' } );
          const endStr = endOfWeek.toLocaleDateString( 'en-US', { day: 'numeric', month: 'short' } );
          const year = startOfWeek.getFullYear();
          const prefix = weekOffset === 0 ? 'This week' : 'Week of';
          const weekDisplay = `${ prefix } : ${ startStr } -> ${ endStr } ${ year }`;
          return { days: weekDays, weekDisplay };
     }, [ weekOffset ] ); // Depend on weekOffset

     // Helper function to normalize time format
     const normalizeTime = useCallback( ( time: string ) => {
          if ( time.includes( ':' ) ) return time;
          if ( time.length === 4 ) return `${ time.slice( 0, 2 ) }:${ time.slice( 2 ) }`;
          if ( time.length === 3 ) return `${ time[ 0 ] }:${ time.slice( 1 ) }`;
          return time;
     }, [] );

     const updateProject = ( id: number, project: string ) => {
          setRows( prev => prev.map( r => r.id === id ? { ...r, project } : r ) );
     };

     const updateTask = ( id: number, task: string ) => {
          setRows( prev => prev.map( r => r.id === id ? { ...r, task } : r ) );
     };

     // Calculate daily totals across all rows
     const calculateDailyTotals = useCallback( () => {
          const dailyTotals: Record<string, number> = {};
          days.forEach( day => dailyTotals[ day ] = 0 );
          rows.forEach( row => {
               days.forEach( day => {
                    const time = row.times[ day ] || '';
                    const normalized = normalizeTime( time );
                    if ( normalized && normalized.includes( ':' ) ) {
                         const [ hours, minutes ] = normalized.split( ':' ).map( Number );
                         if ( !isNaN( hours ) && !isNaN( minutes ) ) {
                              dailyTotals[ day ] += hours * 60 + minutes;
                         }
                    }
               } );
          } );
          const formattedTotals: Record<string, string> = {};
          days.forEach( day => {
               const totalMinutes = dailyTotals[ day ];
               const totalHours = Math.floor( totalMinutes / 60 );
               const totalMins = totalMinutes % 60;
               formattedTotals[ day ] = `${ totalHours.toString().padStart( 2, '0' ) }:${ totalMins.toString().padStart( 2, '0' ) }`;
          } );
          return formattedTotals;
     }, [ rows, days, normalizeTime ] );

     const dailyTotals = calculateDailyTotals();

     // Calculate grand total
     const grandTotal = useMemo( () => {
          let totalMinutes = 0;
          Object.values( dailyTotals ).forEach( time => {
               if ( time && time.includes( ':' ) ) {
                    const [ hours, minutes ] = time.split( ':' ).map( Number );
                    if ( !isNaN( hours ) && !isNaN( minutes ) ) {
                         totalMinutes += hours * 60 + minutes;
                    }
               }
          } );
          const totalHours = Math.floor( totalMinutes / 60 );
          const totalMins = totalMinutes % 60;
          return `${ totalHours.toString().padStart( 2, '0' ) }:${ totalMins.toString().padStart( 2, '0' ) }`;
     }, [ dailyTotals ] );

     return (
          <React.Fragment>
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
                         <div className="border rounded align-self-center mx-3 p-1">{ weekDisplay }</div>
                         <Button
                              variant="primary"
                              size='sm'
                              onClick={ () => setWeekOffset( prev => prev + 1 ) }
                         >
                              Next
                              <FeatherIcon icon='arrow-right-circle' className='ms-2' />
                         </Button>
                    </div>
                    <TimesheetAddAction
                         rows={ rows }
                         setRows={ setRows }
                    />
               </div>
               <Table
                    bordered responsive
               >
                    <thead>
                         <tr>
                              <th>PROJECT</th>
                              <th>TASK</th>
                              { days.map( day => (
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
                                             value={ row.project }
                                             onChange={ ( project ) => updateProject( row.id, project ) }
                                        />
                                   </td>
                                   <td>
                                        <TimesheetTask
                                             value={ row.task }
                                             onChange={ ( task ) => updateTask( row.id, task ) }
                                        />
                                   </td>
                                   { days.map( day => (
                                        <td key={ day }>
                                             <TimesheetDay
                                                  row={ row }
                                                  setRows={ setRows }
                                                  day={ day }
                                             />
                                        </td>
                                   ) ) }
                                   <td>
                                        { row.total }
                                   </td>
                                   <td className={ classNames( 'd-flex' ) }>
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
                              { days.map( day => (
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
