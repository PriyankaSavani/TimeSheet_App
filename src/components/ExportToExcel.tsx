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
     addBlankRowAfterHeader?: boolean;
     columnAlignments: ( 'center' | 'left' | 'right' )[];
     headerStyle?: {
          size?: number;
          color?: string;
          bg?: string;
          borderColor?: string;
          borderStyle?: 'thin' | 'medium' | 'thick' | 'double';
          padding?: number;
          bold?: boolean | number;
          rowHeight?: number
     };
     dataStyle?: {
          size?: number;
          color?: string,
          bg?: string;
          borderColor?: string;
          borderStyle?: 'thin' | 'medium' | 'thick' | 'double';
          bold?: boolean | number;
          rowHeight?: number
     };
}

const ExportToExcel: React.FC<ExportToExcelProps> = ( {
     data,
     filename = 'export.xlsx',
     sheetName = 'Sheet1',
     buttonText = 'Export to Excel',
     buttonVariant = 'primary',
     buttonSize = 'sm',
     className = 'me-2',
     columnAlignments,
     headerStyle = {
          size: 14,
          color: 'FF6658DD',
          bg: 'FFFFFFFF',
          borderColor: 'FF6658DD',
          borderStyle: 'thick',
          padding: 7,
          rowHeight: 30
     },
     dataStyle = {
          size: 12,
          color: 'FF000000',
          bg: 'FFFFFF7D',
          borderColor: 'FF000000',
          borderStyle: 'thin',
          rowHeight: 20
     },
} ) => {
     const handleExport = async () => {
          // Create a new workbook and worksheet
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet( sheetName );

          // Add two empty rows with same height
          const emptyRow1 = worksheet.addRow( [] );
          emptyRow1.height = 20;
          const emptyRow2 = worksheet.addRow( [] );
          emptyRow2.height = 20;

          // Set width for first two columns to same length
          worksheet.getColumn( 1 ).width = 5;
          worksheet.getColumn( 2 ).width = 5;
          worksheet.getColumn( 7 ).width = 5;

          // Add data rows with two empty columns at the start
          data.forEach( ( row, rowIndex ) => {
               const modifiedRow = [ '', '', ...row ];
               const newRow = worksheet.addRow( modifiedRow );

               // Set row height
               if ( rowIndex === 0 && headerStyle.rowHeight ) {
                    newRow.height = headerStyle.rowHeight;
               } else if ( rowIndex > 0 && dataStyle.rowHeight ) {
                    newRow.height = dataStyle.rowHeight;
               }

               // Header style (third row, rowIndex 0)
               if ( rowIndex === 0 ) {
                    newRow.eachCell( ( cell, colIndex ) => {
                         if ( colIndex >= 3 ) { // Start from column C
                              cell.font = {
                                   bold: headerStyle.bold !== undefined ? headerStyle.bold : true,
                                   size: headerStyle.size,
                                   color: { argb: headerStyle.color }
                              } as any;
                              cell.fill = {
                                   type: 'pattern',
                                   pattern: 'solid',
                                   fgColor: { argb: headerStyle.bg },
                              };
                              cell.alignment = { horizontal: 'center', vertical: 'middle' };
                              cell.border = {
                                   bottom: { style: headerStyle.borderStyle, color: { argb: headerStyle.borderColor } },
                              };
                         }
                    } );
               } else {
                    newRow.eachCell( ( cell, colIndex ) => {
                         if ( colIndex >= 3 ) { // Start from column C
                              cell.font = {
                                   bold: dataStyle.bold || false,
                                   size: dataStyle.size,
                                   color: { argb: dataStyle.color }
                              } as any;
                              cell.fill = {
                                   type: 'pattern',
                                   pattern: 'solid',
                                   fgColor: { argb: dataStyle.bg },
                              };
                              const alignment = columnAlignments && columnAlignments[ colIndex - 3 ] ? columnAlignments[ colIndex - 3 ] : 'center';
                              cell.alignment = { horizontal: alignment, vertical: 'middle' };
                              cell.border = {
                                   top: { style: dataStyle.borderStyle, color: { argb: dataStyle.borderColor } },
                                   left: { style: dataStyle.borderStyle, color: { argb: dataStyle.borderColor } },
                                   bottom: { style: dataStyle.borderStyle, color: { argb: dataStyle.borderColor } },
                                   right: { style: dataStyle.borderStyle, color: { argb: dataStyle.borderColor } },
                              };
                         }
                    } );
               }

               // Add blank row after header (mandatory)
               if ( rowIndex === 0 ) {
                    const blankRow = worksheet.addRow( [ '', '', ...Array( row.length ).fill( '' ) ] );
                    blankRow.height = dataStyle.rowHeight || 20;
               }
          } );

          // Border around data range
          const startRow = 2; // Data starts at row 3
          const endRow = startRow + data.length + 2; // Last data row
          const startCol = 2; // Data starts at column C
          const endCol = startCol + data[ 0 ].length + 1; // Last data column

          for ( let row = startRow; row <= endRow; row++ ) {
               for ( let col = startCol; col <= endCol; col++ ) {
                    const cell = worksheet.getCell( row, col );
                    const border: any = {};
                    if ( row === startRow ) border.top = { style: 'thick', color: { argb: 'FF000000' } };
                    if ( row === endRow ) border.bottom = { style: 'thick', color: { argb: 'FF000000' } };
                    if ( col === startCol ) border.left = { style: 'thick', color: { argb: 'FF000000' } };
                    if ( col === endCol ) border.right = { style: 'thick', color: { argb: 'FF000000' } };
                    cell.border = { ...cell.border, ...border };
               }
          }

          // Auto-adjust column width (starting from column C)
          const numColumns = data[ 0 ].length;
          for ( let colIndex = 0; colIndex < numColumns; colIndex++ ) {
               let maxLength = 10;
               data.forEach( ( row ) => {
                    const cellValue = row[ colIndex ] ? row[ colIndex ].toString() : '';
                    if ( cellValue.length > maxLength ) maxLength = cellValue.length;
               } );
               // Increase padding for header font size
               const extraPadding = ( headerStyle.size || 14 ) > 12 ? 2 : 0;
               const padding = headerStyle.padding || 0;
               worksheet.getColumn( colIndex + 3 ).width = maxLength + 2 + extraPadding + padding; // +3 because columns A, B are empty
          }

          // Export file
          const buffer = await workbook.xlsx.writeBuffer();
          saveAs( new Blob( [ buffer ] ), filename );
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
