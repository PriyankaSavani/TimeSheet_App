import React from 'react';
import jsPDF from 'jspdf';
import { Button } from 'react-bootstrap';
import FeatherIcon from 'feather-icons-react';

interface ExportToPdfProps {
     data: any[][];
     filename: string;
     buttonText: string;
     buttonVariant: string;
     buttonSize: 'sm' | 'lg';
     className?: string;
     title: string;
     weekStart?: string;
     weekEnd?: string;
     totalHours?: number;
     columnAlignments: ( 'center' | 'left' | 'right' )[];
     orientation: 'portrait' | 'landscape';
     logo?: string; // Base64 encoded image or URL
     headerStyle?: {
          size?: number;
          color?: string;
          bg?: string;
     };
     dataStyle?: {
          size?: number;
          color?: string;
          bg?: string;
     };
}

/**
 * Wraps text to fit within a specified column width
 * @param text - The text to wrap
 * @param maxWidth - Maximum width available for the text (in mm)
 * @param doc - The jsPDF document instance
 * @param fontSize - Font size to use for width calculation
 * @returns Array of wrapped lines
 */
const wrapText = ( text: string, maxWidth: number, doc: jsPDF, fontSize: number = 9 ): string[] => {
     if ( !text ) return [ '' ];

     // First, handle existing newlines
     const lines = text.toString().split( '\n' );
     const wrappedLines: string[] = [];

     doc.setFontSize( fontSize );
     doc.setFont( 'helvetica', 'normal' );

     for ( const line of lines ) {
          if ( doc.getTextWidth( line ) <= maxWidth ) {
               wrappedLines.push( line );
          } else {
               // Need to wrap this line
               const words = line.split( ' ' );
               let currentLine = '';

               for ( const word of words ) {
                    const testLine = currentLine ? `${ currentLine } ${ word }` : word;
                    if ( doc.getTextWidth( testLine ) <= maxWidth ) {
                         currentLine = testLine;
                    } else {
                         if ( currentLine ) {
                              wrappedLines.push( currentLine );
                         }
                         // Check if single word is wider than maxWidth
                         if ( doc.getTextWidth( word ) > maxWidth ) {
                              // Need to break the word itself
                              let chars = word;
                              let testCharLine = '';
                              for ( const char of chars ) {
                                   const testChar = testCharLine + char;
                                   if ( doc.getTextWidth( testChar ) <= maxWidth ) {
                                        testCharLine = testChar;
                                   } else {
                                        wrappedLines.push( testCharLine );
                                        testCharLine = char;
                                   }
                              }
                              currentLine = testCharLine;
                         } else {
                              currentLine = word;
                         }
                    }
               }
               if ( currentLine ) {
                    wrappedLines.push( currentLine );
               }
          }
     }

     return wrappedLines;
};

/**
 * Calculates the maximum number of lines needed for each row
 * @param data - 2D array of data (excluding header)
 * @param columns - Column configuration
 * @param doc - The jsPDF document instance
 * @param lineHeight - Height per line in mm
 * @returns Array of row heights
 */
const calculateRowHeights = (
     data: any[][],
     columns: { key: string; width: number }[],
     doc: jsPDF,
     lineHeight: number = 5
): number[] => {
     const MIN_CELL_HEIGHT = 10; // Minimum cell height

     return data.map( row => {
          let maxLines = 1;

          // Check PROJECT (index 1) and DESCRIPTION (index 4) columns for wrapping needs
          const wrapColumnIndices = [ 1, 4 ]; // Project and Description

          for ( const colIdx of wrapColumnIndices ) {
               if ( colIdx < row.length ) {
                    const cellValue = row[ colIdx ]?.toString() || '';
                    const colWidth = columns[ colIdx ]?.width || 30;
                    // Account for padding (3mm on each side)
                    const availableWidth = colWidth - 6;

                    if ( cellValue ) {
                         const wrappedLines = wrapText( cellValue, availableWidth, doc );
                         if ( wrappedLines.length > maxLines ) {
                              maxLines = wrappedLines.length;
                         }
                    }
               }
          }

          // Calculate height based on number of lines, but minimum is MIN_CELL_HEIGHT
          const calculatedHeight = Math.max( maxLines * lineHeight + 2, MIN_CELL_HEIGHT );
          return calculatedHeight;
     } );
};

const ExportToPdf: React.FC<ExportToPdfProps> = ( {
     data,
     filename,
     buttonText,
     buttonVariant,
     buttonSize,
     className = 'me-2',
     title,
     weekStart,
     weekEnd,
     totalHours,
     columnAlignments = [],
     orientation,
     logo,
} ) => {
     // Colors matching Excel export
     const COLORS = {
          // Header/band colors
          headPurple: [ 94, 74, 122 ],      // #5E4A7A
          headBrown: [ 122, 78, 26 ],       // #7A4A1A
          headNavy: [ 35, 54, 74 ],         // #23364A
          headGreen: [ 44, 94, 44 ],        // #2C5E2C

          // Lighter data fills
          dataPurple: [ 227, 221, 240 ],    // #E3DDF0
          dataBrown: [ 240, 227, 216 ],    // #F0E3D8
          dataNavy: [ 220, 229, 239 ],     // #DCE5EF
          dataGreen: [ 223, 234, 224 ],    // #DFEAE0

          // Footer
          footerGreen: [ 16, 163, 74 ],     // #10A34A

          // Text
          white: [ 255, 255, 255 ],
          textDark: [ 51, 51, 51 ],
     };

     const handleExport = async () => {
          const doc = new jsPDF( orientation );
          const pageWidth = doc.internal.pageSize.getWidth();

          // Column configuration matching Excel - 7 columns now
          const columns = [
               { key: 'date', width: 18, label: 'DATE', color: COLORS.headPurple, dataColor: COLORS.dataPurple },
               { key: 'project', width: 30, label: 'PROJECT', color: COLORS.headBrown, dataColor: COLORS.dataBrown },
               { key: 'client', width: 22, label: 'CLIENT', color: COLORS.headBrown, dataColor: COLORS.dataBrown },
               { key: 'task', width: 20, label: 'TASK', color: COLORS.headBrown, dataColor: COLORS.dataBrown },
               { key: 'description', width: 55, label: 'DESCRIPTION', color: COLORS.headBrown, dataColor: COLORS.dataBrown },
               { key: 'hours', width: 22, label: 'HOURS', color: COLORS.headNavy, dataColor: COLORS.dataNavy },
               { key: 'member', width: 22, label: 'USER NAME', color: COLORS.headGreen, dataColor: COLORS.dataGreen },
          ];

          // Add logo and title on the same line
          if ( logo ) {
               try {
                    // Fetch the image and convert to base64
                    const response = await fetch( logo );
                    const blob = await response.blob();
                    const reader = new FileReader();
                    const base64 = await new Promise<string>( ( resolve, reject ) => {
                         reader.onload = () => resolve( reader.result as string );
                         reader.onerror = reject;
                         reader.readAsDataURL( blob );
                    } );
                    const logoWidth = 40;
                    const logoHeight = 15;
                    const logoX = pageWidth - logoWidth - 14; // Right side
                    const logoY = 14;
                    doc.addImage( base64, 'PNG', logoX, logoY, logoWidth, logoHeight );
               } catch ( error ) {
                    console.error( 'Error loading logo:', error );
               }
          }

          // Add title on the left
          doc.setFontSize( 18 );
          doc.setTextColor( COLORS.textDark[ 0 ], COLORS.textDark[ 1 ], COLORS.textDark[ 2 ] );
          doc.text( title, 14, 22 );

          // Add week range centered
          if ( weekStart && weekEnd ) {
               doc.setFontSize( 10 );
               doc.setTextColor( COLORS.textDark[ 0 ], COLORS.textDark[ 1 ], COLORS.textDark[ 2 ] );
               const weekText = `${ weekStart } - ${ weekEnd }`;
               doc.text( weekText, 14, 30 );
          }

          // Add total hours centered
          if ( totalHours !== undefined ) {
               doc.setFontSize( 12 );
               doc.setTextColor( COLORS.textDark[ 0 ], COLORS.textDark[ 1 ], COLORS.textDark[ 2 ] );
               const hoursText = `Total Hours: ${ totalHours.toFixed( 2 ) }`;
               doc.text( hoursText, 14, 38 );
          }

          let yPosition = 50;
          const cellHeight = 10; // Normal cell height
          const lineHeight = 5;

          // ---- Row 1: Colored band with category labels ----
          const bandRowIdx = yPosition;

          // MONTH band (DATE column)
          doc.setFillColor( COLORS.headPurple[ 0 ], COLORS.headPurple[ 1 ], COLORS.headPurple[ 2 ] );
          doc.rect( 14, bandRowIdx, columns[ 0 ].width, cellHeight, 'F' );
          doc.setTextColor( COLORS.white[ 0 ], COLORS.white[ 1 ], COLORS.white[ 2 ] );
          doc.setFontSize( 9 );
          doc.setFont( 'helvetica', 'bold' );
          doc.text( 'MONTH', 14 + columns[ 0 ].width / 2, bandRowIdx + 6.5, { align: 'center' } );

          // PROJECT DETAILS band (PROJECT, CLIENT, TASK, DESCRIPTION columns)
          const projectDetailsWidth = columns[ 1 ].width + columns[ 2 ].width + columns[ 3 ].width + columns[ 4 ].width;
          doc.setFillColor( COLORS.headBrown[ 0 ], COLORS.headBrown[ 1 ], COLORS.headBrown[ 2 ] );
          doc.rect( 14 + columns[ 0 ].width, bandRowIdx, projectDetailsWidth, cellHeight, 'F' );
          doc.setTextColor( COLORS.white[ 0 ], COLORS.white[ 1 ], COLORS.white[ 2 ] );
          doc.text( 'PROJECT DETAILS', 14 + columns[ 0 ].width + projectDetailsWidth / 2, bandRowIdx + 6.5, { align: 'center' } );

          // DURATIONS band (HOURS column - columns[5])
          doc.setFillColor( COLORS.headNavy[ 0 ], COLORS.headNavy[ 1 ], COLORS.headNavy[ 2 ] );
          doc.rect( 14 + columns[ 0 ].width + projectDetailsWidth, bandRowIdx, columns[ 5 ].width, cellHeight, 'F' );
          doc.setTextColor( COLORS.white[ 0 ], COLORS.white[ 1 ], COLORS.white[ 2 ] );
          doc.text( 'DURATIONS', 14 + columns[ 0 ].width + projectDetailsWidth + columns[ 5 ].width / 2, bandRowIdx + 6.5, { align: 'center' } );

          // MEMBER band (USER NAME column - columns[6])
          doc.setFillColor( COLORS.headGreen[ 0 ], COLORS.headGreen[ 1 ], COLORS.headGreen[ 2 ] );
          doc.rect( 14 + columns[ 0 ].width + projectDetailsWidth + columns[ 5 ].width, bandRowIdx, columns[ 6 ].width, cellHeight, 'F' );
          doc.setTextColor( COLORS.white[ 0 ], COLORS.white[ 1 ], COLORS.white[ 2 ] );
          doc.text( 'MEMBER', 14 + columns[ 0 ].width + projectDetailsWidth + columns[ 5 ].width + columns[ 6 ].width / 2, bandRowIdx + 6.5, { align: 'center' } );

          yPosition += cellHeight;

          // ---- Row 2: Column headers ----
          const headerRowIdx = yPosition;
          let xPosition = 14;

          columns.forEach( ( col, colIndex ) => {
               // Draw header cell with white background
               doc.setFillColor( 255, 255, 255 );
               doc.rect( xPosition, headerRowIdx, col.width, cellHeight, 'F' );

               // Draw border
               doc.setDrawColor( 204, 204, 204 );
               doc.rect( xPosition, headerRowIdx, col.width, cellHeight, 'S' );

               // Draw text
               doc.setTextColor( COLORS.textDark[ 0 ], COLORS.textDark[ 1 ], COLORS.textDark[ 2 ] );
               doc.setFontSize( 10 );
               doc.setFont( 'helvetica', 'bold' );

               const alignment = columnAlignments[ colIndex ] || ( col.key === 'description' ? 'left' : 'center' );
               let textX;
               if ( alignment === 'left' ) {
                    textX = xPosition + 3;
               } else if ( alignment === 'right' ) {
                    textX = xPosition + col.width - 3;
               } else {
                    textX = xPosition + col.width / 2;
               }
               doc.text( col.label, textX, headerRowIdx + 6.5, { align: alignment === 'center' ? 'center' : alignment } );

               xPosition += col.width;
          } );

          yPosition += cellHeight;

          // ---- Data rows ----
          // Expect data[0] is header, rest is body
          const body = data.slice( 1 );

          // Calculate row heights dynamically based on content
          const rowHeights = calculateRowHeights( body, columns, doc, lineHeight );

          // Track latest date found for footer - use any to avoid TypeScript narrowing issues
          let latestDate: any = null;

          for ( let rowIdx = 0; rowIdx < body.length; rowIdx++ ) {
               const row = body[ rowIdx ];
               const currentRowHeight = rowHeights[ rowIdx ];
               let rowXPosition = 14;

               // Parse date for tracking
               const dateVal = row[ 0 ];
               if ( dateVal ) {
                    const parsedDate = new Date( dateVal );
                    const parsedTime = parsedDate.getTime();
                    if ( !isNaN( parsedTime ) && ( latestDate === null || parsedDate.getTime() > latestDate.getTime() ) ) {
                         latestDate = parsedDate;
                    }
               }

               for ( let colIdx = 0; colIdx < columns.length; colIdx++ ) {
                    const col = columns[ colIdx ];
                    const cellValue = row[ colIdx ];
                    const alignment = columnAlignments[ colIdx ] || ( col.key === 'project' || col.key === 'description' ? 'left' : 'center' );

                    // Draw cell with colored background using dynamic row height
                    doc.setFillColor( col.dataColor[ 0 ], col.dataColor[ 1 ], col.dataColor[ 2 ] );
                    doc.rect( rowXPosition, yPosition, col.width, currentRowHeight, 'F' );

                    // Draw border
                    doc.setDrawColor( 204, 204, 204 );
                    doc.rect( rowXPosition, yPosition, col.width, currentRowHeight, 'S' );

                    // Draw text with vertical centering
                    doc.setTextColor( COLORS.textDark[ 0 ], COLORS.textDark[ 1 ], COLORS.textDark[ 2 ] );
                    doc.setFontSize( 9 );
                    doc.setFont( 'helvetica', 'normal' );

                    // Get text - use wrapText for PROJECT (index 1) and DESCRIPTION (index 4) columns
                    const textValue = cellValue?.toString() || '';
                    let textLines: string[];

                    // Use automatic wrapping for project and description columns
                    if ( colIdx === 1 || colIdx === 4 ) {
                         // Account for padding (3mm on each side)
                         const availableWidth = col.width - 6;
                         textLines = wrapText( textValue, availableWidth, doc );
                    } else {
                         // For other columns, just split on explicit newlines
                         textLines = textValue.includes( '\n' ) ? textValue.split( '\n' ) : [ textValue ];
                    }

                    const totalTextHeight = textLines.length * lineHeight;
                    // Vertically center the text in the cell
                    const textStartY = yPosition + ( currentRowHeight - totalTextHeight ) / 2 + 3;

                    for ( let lineIdx = 0; lineIdx < textLines.length; lineIdx++ ) {
                         const line = textLines[ lineIdx ];
                         let textX;
                         if ( alignment === 'left' ) {
                              textX = rowXPosition + 3;
                         } else if ( alignment === 'right' ) {
                              textX = rowXPosition + col.width - 3;
                         } else {
                              textX = rowXPosition + col.width / 2;
                         }
                         doc.text( line, textX, textStartY + ( lineIdx * lineHeight ), { align: alignment } );
                    }

                    rowXPosition += col.width;
               }

               yPosition += currentRowHeight;

               // Add new page if needed
               if ( yPosition > 270 ) {
                    doc.addPage();
                    yPosition = 20;
               }
          }

          // ---- Footer row ----
          const footerRowIdx = yPosition;

          // Calculate widths for footer sections - columns B through F = date to description
          const dateToDescWidth = columns[ 0 ].width + columns[ 1 ].width + columns[ 2 ].width + columns[ 3 ].width + columns[ 4 ].width;

          // Determine end of period text
          let endOfText = 'END OF PERIOD - TOTAL HOURS';

          // Try weekEnd first
          if ( weekEnd ) {
               const d = new Date( weekEnd );
               const time = d.getTime();
               if ( !isNaN( time ) ) {
                    const month = d.toLocaleString( undefined, { month: 'long' } ).toUpperCase();
                    const year = d.getFullYear();
                    endOfText = `END OF ${ month } ${ year } - TOTAL HOURS`;
               }
          }
          // Try latestDate from data if weekEnd didn't work
          else if ( latestDate instanceof Date && !isNaN( latestDate.getTime() ) ) {
               const month = latestDate.toLocaleString( undefined, { month: 'long' } ).toUpperCase();
               const year = latestDate.getFullYear();
               endOfText = `END OF ${ month } ${ year } - TOTAL HOURS`;
          }

          // Left block (B..F) - END OF period - TOTAL HOURS (green background)
          doc.setFillColor( COLORS.footerGreen[ 0 ], COLORS.footerGreen[ 1 ], COLORS.footerGreen[ 2 ] );
          doc.rect( 14, footerRowIdx, dateToDescWidth, cellHeight, 'F' );
          doc.setTextColor( COLORS.white[ 0 ], COLORS.white[ 1 ], COLORS.white[ 2 ] );
          doc.setFontSize( 9 );
          doc.setFont( 'helvetica', 'bold' );
          doc.text( endOfText, 14 + dateToDescWidth / 2, footerRowIdx + 6.5, { align: 'center' } );

          // Column G - Total hours value (green background)
          doc.setFillColor( COLORS.footerGreen[ 0 ], COLORS.footerGreen[ 1 ], COLORS.footerGreen[ 2 ] );
          doc.rect( 14 + dateToDescWidth, footerRowIdx, columns[ 5 ].width, cellHeight, 'F' );
          doc.setTextColor( COLORS.white[ 0 ], COLORS.white[ 1 ], COLORS.white[ 2 ] );
          doc.text( totalHours?.toFixed( 2 ) || '0.00', 14 + dateToDescWidth + columns[ 5 ].width / 2, footerRowIdx + 6.5, { align: 'center' } );

          // Column H - Empty with green background only
          doc.setFillColor( COLORS.footerGreen[ 0 ], COLORS.footerGreen[ 1 ], COLORS.footerGreen[ 2 ] );
          doc.rect( 14 + dateToDescWidth + columns[ 5 ].width, footerRowIdx, columns[ 6 ].width, cellHeight, 'F' );
          doc.setTextColor( COLORS.white[ 0 ], COLORS.white[ 1 ], COLORS.white[ 2 ] );
          doc.text( '', 14 + dateToDescWidth + columns[ 5 ].width + columns[ 6 ].width / 2, footerRowIdx + 6.5, { align: 'center' } );

          // Save the PDF
          doc.save( filename );
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

export default ExportToPdf;

