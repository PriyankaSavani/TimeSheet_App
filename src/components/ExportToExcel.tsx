import React from 'react';
import * as XLSX from 'xlsx';
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
}

const ExportToExcel: React.FC<ExportToExcelProps> = ( {
     data,
     filename = 'export.xlsx',
     sheetName = 'Sheet1',
     buttonText = 'Export to Excel',
     buttonVariant = 'primary',
     buttonSize = 'sm',
     className = 'me-2'
} ) => {
     const handleExport = () => {
          // Create worksheet
          const ws = XLSX.utils.aoa_to_sheet( data );

          // Create workbook
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet( wb, ws, sheetName );

          // Download file
          XLSX.writeFile( wb, filename );
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
