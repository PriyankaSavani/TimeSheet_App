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

          // Column configuration matching Excel
          const columns = [
               { key: 'date', width: 22, label: 'DATE', color: COLORS.headPurple, dataColor: COLORS.dataPurple },
               { key: 'project', width: 30, label: 'PROJECT', color: COLORS.headBrown, dataColor: COLORS.dataBrown },
               { key: 'task', width: 18, label: 'TASK', color: COLORS.headBrown, dataColor: COLORS.dataBrown },
               { key: 'description', width: 60, label: 'DESCRIPTION', color: COLORS.headBrown, dataColor: COLORS.dataBrown },
               { key: 'hours', width: 25, label: 'HOURS', color: COLORS.headNavy, dataColor: COLORS.dataNavy },
               { key: 'member', width: 25, label: 'MEMBER', color: COLORS.headGreen, dataColor: COLORS.dataGreen },
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

          // PROJECT DETAILS band (PROJECT, TASK, DESCRIPTION columns)
          const projectDetailsWidth = columns[ 1 ].width + columns[ 2 ].width + columns[ 3 ].width;
          doc.setFillColor( COLORS.headBrown[ 0 ], COLORS.headBrown[ 1 ], COLORS.headBrown[ 2 ] );
          doc.rect( 14 + columns[ 0 ].width, bandRowIdx, projectDetailsWidth, cellHeight, 'F' );
          doc.setTextColor( COLORS.white[ 0 ], COLORS.white[ 1 ], COLORS.white[ 2 ] );
          doc.text( 'PROJECT DETAILS', 14 + columns[ 0 ].width + projectDetailsWidth / 2, bandRowIdx + 6.5, { align: 'center' } );

          // DURATIONS band (HOURS column)
          doc.setFillColor( COLORS.headNavy[ 0 ], COLORS.headNavy[ 1 ], COLORS.headNavy[ 2 ] );
          doc.rect( 14 + columns[ 0 ].width + projectDetailsWidth, bandRowIdx, columns[ 4 ].width, cellHeight, 'F' );
          doc.setTextColor( COLORS.white[ 0 ], COLORS.white[ 1 ], COLORS.white[ 2 ] );
          doc.text( 'DURATIONS', 14 + columns[ 0 ].width + projectDetailsWidth + columns[ 4 ].width / 2, bandRowIdx + 6.5, { align: 'center' } );

          // MEMBER band (USER NAME column)
          doc.setFillColor( COLORS.headGreen[ 0 ], COLORS.headGreen[ 1 ], COLORS.headGreen[ 2 ] );
          doc.rect( 14 + columns[ 0 ].width + projectDetailsWidth + columns[ 4 ].width, bandRowIdx, columns[ 5 ].width, cellHeight, 'F' );
          doc.setTextColor( COLORS.white[ 0 ], COLORS.white[ 1 ], COLORS.white[ 2 ] );
          doc.text( 'MEMBER', 14 + columns[ 0 ].width + projectDetailsWidth + columns[ 4 ].width + columns[ 5 ].width / 2, bandRowIdx + 6.5, { align: 'center' } );

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

          // Track latest date found for footer - use any to avoid TypeScript narrowing issues
          let latestDate: any = null;

          for ( let rowIdx = 0; rowIdx < body.length; rowIdx++ ) {
               const row = body[ rowIdx ];
               xPosition = 14;

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

                    // Draw cell with colored background
                    doc.setFillColor( col.dataColor[ 0 ], col.dataColor[ 1 ], col.dataColor[ 2 ] );
                    doc.rect( xPosition, yPosition, col.width, cellHeight, 'F' );

                    // Draw border
                    doc.setDrawColor( 204, 204, 204 );
                    doc.rect( xPosition, yPosition, col.width, cellHeight, 'S' );

                    // Draw text with vertical centering
                    doc.setTextColor( COLORS.textDark[ 0 ], COLORS.textDark[ 1 ], COLORS.textDark[ 2 ] );
                    doc.setFontSize( 8 );
                    doc.setFont( 'helvetica', 'normal' );

                    // Get text and calculate vertical centering
                    const textValue = cellValue?.toString() || '';
                    const textLines = textValue.includes( '\n' ) ? textValue.split( '\n' ) : [ textValue ];
                    const totalTextHeight = textLines.length * lineHeight;
                    // Vertically center the text in the cell
                    const textStartY = yPosition + ( cellHeight - totalTextHeight ) / 2 + 3;

                    textLines.forEach( ( line: string, lineIdx: number ) => {
                         let textX;
                         if ( alignment === 'left' ) {
                              textX = xPosition + 3;
                         } else if ( alignment === 'right' ) {
                              textX = xPosition + col.width - 3;
                         } else {
                              textX = xPosition + col.width / 2;
                         }
                         doc.text( line, textX, textStartY + ( lineIdx * lineHeight ), { align: alignment } );
                    } );

                    xPosition += col.width;
               }

               yPosition += cellHeight;

               // Add new page if needed
               if ( yPosition > 270 ) {
                    doc.addPage();
                    yPosition = 20;
               }
          }

          // ---- Footer row ----
          const lastDataRow = yPosition;
          const footerRowIdx = yPosition;

          // Calculate widths for footer sections
          const dateTaskWidth = columns[ 0 ].width + columns[ 1 ].width + columns[ 2 ].width + columns[ 3 ].width;

          // Determine end of period text - use a regular variable instead of type guard
          let endOfText = 'END OF PERIOD';

          // Try weekEnd first
          if ( weekEnd ) {
               const d = new Date( weekEnd );
               const time = d.getTime();
               if ( !isNaN( time ) ) {
                    const month = d.toLocaleString( undefined, { month: 'long' } ).toUpperCase();
                    const year = d.getFullYear();
                    endOfText = `END OF ${ month } ${ year }`;
               }
          }
          // Try latestDate from data if weekEnd didn't work
          else if ( latestDate instanceof Date && !isNaN( latestDate.getTime() ) ) {
               const month = latestDate.toLocaleString( undefined, { month: 'long' } ).toUpperCase();
               const year = latestDate.getFullYear();
               endOfText = `END OF ${ month } ${ year }`;
          }

          // Left block - END OF period (DATE through DESCRIPTION)
          doc.setFillColor( COLORS.footerGreen[ 0 ], COLORS.footerGreen[ 1 ], COLORS.footerGreen[ 2 ] );
          doc.rect( 14, footerRowIdx, dateTaskWidth, cellHeight, 'F' );
          doc.setTextColor( COLORS.white[ 0 ], COLORS.white[ 1 ], COLORS.white[ 2 ] );
          doc.setFontSize( 9 );
          doc.setFont( 'helvetica', 'bold' );
          doc.text( endOfText, 14 + dateTaskWidth / 2, footerRowIdx + 6.5, { align: 'center' } );

          // Middle block - "Total" label (HOURS column)
          doc.setFillColor( COLORS.footerGreen[ 0 ], COLORS.footerGreen[ 1 ], COLORS.footerGreen[ 2 ] );
          doc.rect( 14 + dateTaskWidth, footerRowIdx, columns[ 4 ].width, cellHeight, 'F' );
          doc.setTextColor( COLORS.white[ 0 ], COLORS.white[ 1 ], COLORS.white[ 2 ] );
          doc.text( 'Total', 14 + dateTaskWidth + columns[ 4 ].width / 2, footerRowIdx + 6.5, { align: 'center' } );

          // Right block - Total hours value (MEMBER column)
          doc.setFillColor( COLORS.footerGreen[ 0 ], COLORS.footerGreen[ 1 ], COLORS.footerGreen[ 2 ] );
          doc.rect( 14 + dateTaskWidth + columns[ 4 ].width, footerRowIdx, columns[ 5 ].width, cellHeight, 'F' );
          doc.setTextColor( COLORS.white[ 0 ], COLORS.white[ 1 ], COLORS.white[ 2 ] );
          doc.text( totalHours?.toFixed( 2 ) || '0.00', 14 + dateTaskWidth + columns[ 4 ].width + columns[ 5 ].width / 2, footerRowIdx + 6.5, { align: 'center' } );

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
