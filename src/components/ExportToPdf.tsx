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
     columnAlignments: string[];
     orientation: 'portrait' | 'landscape';
     logo?: string; // Base64 encoded image or URL
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
     const handleExport = async () => {
          const doc = new jsPDF( orientation );
          const pageWidth = doc.internal.pageSize.getWidth();

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
          doc.text( title, 14, 22 );

          // Add week range centered
          if ( weekStart && weekEnd ) {
               doc.setFontSize( 10 );
               const weekText = `${ weekStart } - ${ weekEnd }`;
               doc.text( weekText, 14, 30 );
          }

          // Add total hours centered
          if ( totalHours !== undefined ) {
               doc.setFontSize( 12 );
               const hoursText = `Total Hours: ${ totalHours.toFixed( 2 ) }`;
               doc.text( hoursText, 14, 38 );
          }

          let yPosition = 60;
          const cellHeight = 10; // Normal cell height
          const lineHeight = 5;

          // Calculate dynamic widths
          const cellWidths: number[] = [];

          data.forEach( ( row, rowIndex ) => {
               row.forEach( ( cell, colIndex ) => {
                    if ( !cellWidths[ colIndex ] ) cellWidths[ colIndex ] = 0;
                    let textWidth = 0;
                    if ( colIndex === 1 && rowIndex > 0 ) {
                         const cellLines = cell.toString().split( '\n' );
                         cellLines.forEach( ( line: string ) => {
                              textWidth = Math.max( textWidth, doc.getTextWidth( line ) );
                         } );
                    } else {
                         textWidth = doc.getTextWidth( cell.toString() );
                    }
                    cellWidths[ colIndex ] = Math.max( cellWidths[ colIndex ], textWidth + 10 ); // Add padding
               } );
          } );

          // Calculate total table width and center it
          let totalTableWidth = cellWidths.reduce( ( sum, width ) => sum + width, 0 );

          // Scale down column widths if table exceeds pageWidth
          if ( totalTableWidth > pageWidth ) {
               const scale = pageWidth / totalTableWidth;
               for ( let i = 0; i < cellWidths.length; i++ ) {
                    cellWidths[ i ] = cellWidths[ i ] * scale;
               }
               totalTableWidth = pageWidth;
          }

          const startX = ( pageWidth - totalTableWidth ) / 2;

          data.forEach( ( row, rowIndex ) => {
               let x = startX;
               row.forEach( ( cell, colIndex ) => {
                    const cellWidth = cellWidths[ colIndex ];
                    const y = yPosition;

                    // Draw cell border
                    doc.rect( x, y - cellHeight, cellWidth, cellHeight );

                    // Set font for header or data
                    if ( rowIndex === 0 ) {
                         doc.setFontSize( 10 );
                         doc.setFont( 'helvetica', 'bold' );
                    } else {
                         doc.setFontSize( 8 );
                         doc.setFont( 'helvetica', 'normal' );
                    }

                    // Determine alignment
                    const alignment = columnAlignments[ colIndex ] || 'center';

                    // Handle multi-line text for description column (colIndex 1)
                    if ( colIndex === 1 && rowIndex > 0 ) {
                         const lines = cell.toString().split( '\n' );
                         let lineY = y - cellHeight / 2 - ( lines.length - 1 ) * lineHeight / 2 + 3; // Adjust for font baseline
                         lines.forEach( ( line: string, lineIndex: number ) => {
                              const textWidth = doc.getTextWidth( line );
                              let textX;
                              if ( alignment === 'left' ) {
                                   textX = x + 5; // Left padding
                              } else if ( alignment === 'right' ) {
                                   textX = x + cellWidth - textWidth - 5; // Right padding
                              } else {
                                   textX = x + ( cellWidth / 2 ) - ( textWidth / 2 ); // Center
                              }
                              doc.text( line, textX, lineY );
                              lineY += lineHeight;
                         } );
                    } else {
                         // Add text with specified alignment
                         const textWidth = doc.getTextWidth( cell.toString() );
                         let textX;
                         if ( alignment === 'left' ) {
                              textX = x + 5; // Left padding
                         } else if ( alignment === 'right' ) {
                              textX = x + cellWidth - textWidth - 5; // Right padding
                         } else {
                              textX = x + ( cellWidth / 2 ) - ( textWidth / 2 ); // Center
                         }
                         const centerY = y - cellHeight / 2 + 3; // Adjust for font baseline
                         doc.text( cell.toString(), textX, centerY );
                    }

                    x += cellWidth;
               } );

               yPosition += cellHeight;

               // Add new page if needed
               if ( yPosition > 270 ) {
                    doc.addPage();
                    yPosition = 20;
               }
          } );

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
