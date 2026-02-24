import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Button } from 'react-bootstrap';
import FeatherIcon from 'feather-icons-react';

interface ExportToExcelProps {
     data: any[][];
     filename?: string;
     sheetName?: string;
     buttonText?: string;
     buttonVariant?: string;
     buttonSize?: 'sm' | 'lg';
     className?: string;
     addBlankRowAfterHeader?: boolean; // kept for backward compatibility (not used in this layout)
     columnAlignments: ( 'center' | 'left' | 'right' )[];
     headerStyle?: {
          size?: number;
          color?: string;
          bg?: string;
          borderColor?: string;
          borderStyle?: 'thin' | 'medium' | 'thick' | 'double';
          padding?: number;
          bold?: boolean | number;
          rowHeight?: number;
     };
     dataStyle?: {
          size?: number;
          color?: string;
          bg?: string;
          borderColor?: string;
          borderStyle?: 'thin' | 'medium' | 'thick' | 'double';
          bold?: boolean | number;
          rowHeight?: number;
     };
     /** OPTIONAL: if you pass weekEnd (e.g., '2026-01-31'), footer will use its month/year */
     weekEnd?: string;
}

const ExportToExcel: React.FC<ExportToExcelProps> = ( {
     data,
     filename = 'export.xlsx',
     sheetName = 'Sheet1',
     buttonText = 'Export to Excel',
     buttonVariant = 'primary',
     buttonSize = 'sm',
     className = 'me-2',
     columnAlignments = [],
     headerStyle = {
          size: 12,
          color: 'FF333333',
          bg: 'FFFFFFFF',
          borderColor: 'FFCCCCCC',
          borderStyle: 'thin',
          padding: 0,
          rowHeight: 20,
     },
     dataStyle = {
          size: 11,
          color: 'FF000000',
          bg: 'FFFFFFFF',
          borderColor: 'FFCCCCCC',
          borderStyle: 'thin',
          rowHeight: 18,
     },
     weekEnd,
} ) => {
     // Always ARGB in ExcelJS (FF = fully opaque)
     const COLORS = {
          // Header/band colors (unchanged, just with FF alpha added)
          headPurple: 'FF5E4A7A',
          headBrown: 'FF7A4E1A',
          headNavy: 'FF23364A',
          headGreen: 'FF2C5E2C',

          // Lighter data fills (≈ +28% lighten for a soft pastel)
          dataPurple: 'FFE3DDF0',
          dataBrown: 'FFF0E3D8',
          dataNavy: 'FFDCE5EF',
          dataGreen: 'FFDFEAE0',

          // Other colors (kept as you had)
          footerGreen: 'FF10A34A',
          grid: 'FFCCCCCC',
          white: 'FFFFFFFF',
     };

     const BORDER_THIN = { style: 'thin' as ExcelJS.BorderStyle, color: { argb: COLORS.grid } };

     // Parse "HH:mm" -> Excel time (fraction of day)
     const hhmmToExcelTime = ( hhmm: string ) => {
          const [ h, m ] = ( hhmm || '' ).split( ':' ).map( Number );
          if ( isNaN( h ) || isNaN( m ) ) return null;
          const minutes = h * 60 + m;
          return minutes / ( 24 * 60 );
     };

     // Parse assorted date inputs to a Date
     const toDate = ( value: unknown ): Date | null => {
          if ( value instanceof Date ) return isNaN( value.getTime() ) ? null : value;
          if ( typeof value === 'number' ) {
               const d = new Date( value );
               return isNaN( d.getTime() ) ? null : d;
          }
          if ( typeof value === 'string' ) {
               const d = new Date( value );
               if ( !isNaN( d.getTime() ) ) return d;
               // fallback simple parsing M/D/YYYY or MM-DD-YYYY
               const parts = value.split( /[/-]/ ).map( ( p ) => parseInt( p, 10 ) );
               if ( parts.length === 3 && !parts.some( isNaN ) ) {
                    // Assume M/D/YYYY
                    const d2 = new Date( parts[ 2 ], parts[ 0 ] - 1, parts[ 1 ] );
                    return isNaN( d2.getTime() ) ? null : d2;
               }
          }
          return null;
     };

     const isValidDate = ( v: unknown ): v is Date => v instanceof Date && !isNaN( v.getTime() );

     const handleExport = async () => {
          if ( !data || data.length === 0 ) {
               console.warn( 'No data to export.' );
               return;
          }

          // Expect data[0] is header, rest is body
          const header = data[ 0 ];
          const body = data.slice( 1 );

          const wb = new ExcelJS.Workbook();
          const ws = wb.addWorksheet( sheetName );

          // ---- Column layout: A blank spacer; B..G are the 6 visible columns ----
          ws.columns = [
               { key: 'A', width: 2 },   // spacer
               { key: 'B', width: 14 },  // DATE
               { key: 'C', width: 30 },  // PROJECT
               { key: 'D', width: 16 },  // TASK
               { key: 'E', width: 36 },  // DESCRIPTION
               { key: 'F', width: 12 },  // HOURS
               { key: 'G', width: 18 },  // USER NAME
          ];

          // Freeze panes so header stays visible while scrolling
          ws.views = [ { state: 'frozen', xSplit: 1, ySplit: 3 } ]; // freeze column A and top 3 rows

          // Row 1: small spacer
          ws.getRow( 1 ).height = 6;

          // Row 2: Colored band with merges
          const bandRowIdx = 2;
          ws.mergeCells( bandRowIdx, 3, bandRowIdx, 5 ); // D..E  PROJECT DETAILS
          // F      DURATIONS
          // G      MEMBER

          const styleBandCell = ( r: number, c: number, text: string, bg: string ) => {
               const cell = ws.getCell( r, c );
               cell.value = text;
               cell.font = { bold: true, color: { argb: COLORS.white } };
               cell.alignment = { vertical: 'middle', horizontal: 'center' };
               cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
               cell.border = { top: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN, bottom: BORDER_THIN };
          };

          styleBandCell( bandRowIdx, 2, 'MONTH', COLORS.headPurple );
          styleBandCell( bandRowIdx, 4, 'PROJECT DETAILS', COLORS.headBrown );
          styleBandCell( bandRowIdx, 6, 'DURATIONS', COLORS.headNavy );
          styleBandCell( bandRowIdx, 7, 'MEMBER', COLORS.headGreen );
          ws.getRow( bandRowIdx ).height = 18;

          // Row 3: Column headers (white background) - removed spacer row
          const headerRowIdx = 3;
          const hdr = ws.getRow( headerRowIdx );
          hdr.values = [
               , , // A (spacer), we start populating from B
               header?.[ 0 ] ?? 'DATE',
               header?.[ 1 ] ?? 'PROJECT',
               header?.[ 2 ] ?? 'TASK',
               header?.[ 3 ] ?? 'DESCRIPTION',
               header?.[ 4 ] ?? 'HOURS',
               header?.[ 5 ] ?? 'USER NAME',
          ];
          hdr.height = headerStyle.rowHeight ?? 20;

          for ( let col = 2; col <= 7; col++ ) {
               const cell = ws.getCell( headerRowIdx, col );
               cell.font = {
                    bold: headerStyle.bold !== undefined ? !!headerStyle.bold : true,
                    size: headerStyle.size ?? 12,
                    color: { argb: headerStyle.color ?? 'FF333333' },
               };
               cell.alignment = { vertical: 'middle', horizontal: 'center' };
               cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerStyle.bg ?? COLORS.white } };
               cell.border = { top: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN, bottom: BORDER_THIN };
          }

          // Data rows start at row 4 (immediately after header)
          let rowIdx = 4;

          // Track latest date found in column B, and prefer weekEnd if provided
          let latestDate: Date | null = null;

          body.forEach( ( row ) => {
               const r = ws.getRow( rowIdx );

               const dateVal = row[ 0 ];
               const projectVal = row[ 1 ];
               const taskVal = row[ 2 ];
               const descVal = row[ 3 ];
               const hoursVal = row[ 4 ];
               const userVal = row[ 5 ];

               // DATE (B)
               const dateCell = ws.getCell( rowIdx, 2 );
               const parsedDate = toDate( dateVal );
               if ( parsedDate ) {
                    dateCell.value = parsedDate;
                    dateCell.numFmt = 'm/d/yyyy';
                    if ( !latestDate || parsedDate > latestDate ) latestDate = parsedDate;
               } else {
                    dateCell.value = dateVal ?? '';
               }

               // PROJECT (C)
               ws.getCell( rowIdx, 3 ).value = projectVal ?? '';
               // TASK (D)
               ws.getCell( rowIdx, 4 ).value = taskVal ?? '';
               // DESCRIPTION (E)
               ws.getCell( rowIdx, 5 ).value = descVal ?? '';
               // HOURS (F)
               const hoursCell = ws.getCell( rowIdx, 6 );
               const timeFraction = typeof hoursVal === 'string' ? hhmmToExcelTime( hoursVal ) : null;
               if ( timeFraction !== null ) {
                    hoursCell.value = timeFraction;
                    hoursCell.numFmt = '[h]:mm';
               } else {
                    hoursCell.value = hoursVal ?? '';
               }
               // USER (G)
               ws.getCell( rowIdx, 7 ).value = userVal ?? '';

               // Style row: borders + fills + alignment
               for ( let col = 2; col <= 7; col++ ) {
                    const cell = ws.getCell( rowIdx, col );
                    const idx = col - 2; // 0..5
                    const alignment =
                         ( columnAlignments && columnAlignments[ idx ] ) ||
                         ( col === 3 || col === 5 ? 'left' : 'center' ); // default: PROJECT & DESCRIPTION left

                    cell.alignment = { vertical: 'middle', horizontal: alignment };
                    cell.border = { top: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN, bottom: BORDER_THIN };
                    cell.font = {
                         bold: !!dataStyle.bold,
                         size: dataStyle.size ?? 11,
                         color: { argb: dataStyle.color ?? 'FF000000' },
                    };

                    // subtle fills for certain columns to match screenshot
                    if ( col === 2 ) {
                         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dataPurple } };
                    } else if ( col === 3 || col === 4 || col === 5 ) {
                         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dataBrown } };
                    } else if ( col === 6 ) {
                         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dataNavy } };
                    } else if ( col === 7 ) {
                         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dataGreen } };
                    } else {
                         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dataStyle.bg ?? COLORS.white } };
                    }
               }

               r.height = dataStyle.rowHeight ?? 18;
               rowIdx++;
          } );

          const lastDataRow = rowIdx - 1;

          // Footer green band below data
          const footerRowIdx = lastDataRow + 1;
          ws.mergeCells( footerRowIdx, 2, footerRowIdx, 4 ); // B..D => END OF ...
          // Column E (column 5) is single cell for "Total"
          ws.mergeCells( footerRowIdx, 6, footerRowIdx, 7 ); // F..G => PRINT TOTAL HOURS

          // Prefer weekEnd (if provided & valid); otherwise use latestDate from data
          const endBase: Date | null = ( () => {
               if ( weekEnd ) {
                    const d = new Date( weekEnd );
                    if ( isValidDate( d ) ) return d;
               }
               return latestDate;
          } )();

          const endOfText = ( () => {
               const d = endBase;
               if ( isValidDate( d ) ) {
                    const month = d.toLocaleString( undefined, { month: 'long' } ).toUpperCase();
                    const year = d.getFullYear();
                    return `END OF ${ month } ${ year }`;
               }
               return 'END OF PERIOD';
          } )();

          // Left block (B..D) - END OF period text
          const footerLeft = ws.getCell( footerRowIdx, 2 );
          footerLeft.value = endOfText;
          footerLeft.font = { bold: true, color: { argb: COLORS.white } };
          footerLeft.alignment = { vertical: 'middle', horizontal: 'center' };
          footerLeft.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.footerGreen } };
          footerLeft.border = { top: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN, bottom: BORDER_THIN };

          // Middle block (E) - "Total" text
          const footerMiddle = ws.getCell( footerRowIdx, 5 );
          footerMiddle.value = 'Total';
          footerMiddle.font = { bold: true, color: { argb: COLORS.white } };
          footerMiddle.alignment = { vertical: 'middle', horizontal: 'center' };
          footerMiddle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.footerGreen } };
          footerMiddle.border = { top: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN, bottom: BORDER_THIN };

          // Right block (F..G) - PRINT TOTAL HOURS with SUM formula
          const footerRight = ws.getCell( footerRowIdx, 6 );
          footerRight.value = { formula: `SUM(F4:F${ lastDataRow })` };
          footerRight.numFmt = '[h]:mm';
          footerRight.font = { bold: true, color: { argb: COLORS.white } };
          footerRight.alignment = { vertical: 'middle', horizontal: 'center' };
          footerRight.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.footerGreen } };
          footerRight.border = { top: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN, bottom: BORDER_THIN };

          ws.getRow( footerRowIdx ).height = 18;

          // Write file
          const buffer = await wb.xlsx.writeBuffer();
          saveAs(
               new Blob( [ buffer ], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               } ),
               filename
          );
     };

     return (
          <Button
               variant={ buttonVariant }
               size={ buttonSize }
               onClick={ handleExport }
               className={ className }
          >
               <FeatherIcon icon="download" className="me-2" />
               { buttonText }
          </Button>
     );
};

export default ExportToExcel;