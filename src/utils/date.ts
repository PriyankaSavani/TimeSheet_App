import {
     format,
     addWeeks,
     startOfWeek,
     eachDayOfInterval,
} from 'date-fns';

export const getISOWeekKey = ( weekOffset: number ): string => {
     const now = new Date();
     const baseDate = new Date( Date.UTC( now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() ) ); // Normalize to UTC day
     const weekStart = startOfWeek( baseDate, { weekStartsOn: 0 } ); // Sunday start to match original
     const offsetWeekStart = addWeeks( weekStart, weekOffset );
     return format( offsetWeekStart, `yyyy-'W'ww` ); // e.g. 2024-W01
};

export const formatDayKey = ( date: Date ): string => {
     return format( date, `yyyy-MM-dd` ); // Locale-proof: 2024-01-01
};

export const getWeekDays = ( weekOffset: number ): string[] => {
     const now = new Date();
     const baseDate = new Date( Date.UTC( now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() ) );
     const weekStart = startOfWeek( baseDate, { weekStartsOn: 0 } );
     const offsetWeekStart = addWeeks( weekStart, weekOffset );
     const endDate = addWeeks( offsetWeekStart, 1 );
     const days = eachDayOfInterval( { start: offsetWeekStart, end: endDate } );
     return days.map( date => {
          // Display friendly local format
          return date.toLocaleDateString( 'en-US', {
               weekday: 'short',
               day: 'numeric',
               month: 'short'
          } );
     } );
};

export const parseDayKeyToDate = ( dayKey: string, weekOffset: number ): Date => {
     // Reconstruct date from key + offset if needed
     const now = new Date();
     const baseDate = new Date( Date.UTC( now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() ) );
     const weekStart = startOfWeek( baseDate, { weekStartsOn: 0 } );
     const offsetWeekStart = addWeeks( weekStart, weekOffset );
     // For now, simple; enhance if needed
     return offsetWeekStart;
};
