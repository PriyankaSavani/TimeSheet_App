import { useMemo, useCallback } from 'react';

export const useTimesheetCalculations = ( weekOffset: number, rows: any[] ) => {
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
     }, [ weekOffset ] );

     // Helper function to normalize time format
     const normalizeTime = useCallback( ( time: string ) => {
          time = time.replace( /[^0-9]/g, '' ); // remove non-digits
          if ( time.length === 1 ) return `0${ time }:00`;
          if ( time.length === 2 ) return `${ time }:00`;
          if ( time.length === 3 ) return `0${ time[ 0 ] }:${ time.slice( 1 ) }`;
          if ( time.length === 4 ) return `${ time.slice( 0, 2 ) }:${ time.slice( 2 ) }`;
          return '00:00'; // default for empty or invalid
     }, [] );

     // Function to format time input progressively
     const formatTimeInput = useCallback( ( input: string ) => {
          const digits = input.replace( /[^0-9]/g, '' );
          const padded = digits.padStart( 4, '0' ).slice( -4 );
          return `${ padded.slice( 0, 2 ) }:${ padded.slice( 2 ) }`;
     }, [] );

     // Function to calculate total hours for a row
     const calculateRowTotal = useCallback( ( times: Record<string, string> ) => {
          let totalMinutes = 0;
          Object.values( times ).forEach( time => {
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
     }, [] );

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

     return {
          days,
          weekDisplay,
          normalizeTime,
          formatTimeInput,
          calculateRowTotal,
          dailyTotals,
          grandTotal,
     };
};
