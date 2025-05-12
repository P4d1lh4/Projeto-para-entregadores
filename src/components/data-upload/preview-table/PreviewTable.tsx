
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { FoxDelivery } from '@/types/delivery';

type PreviewTableProps = {
  data: FoxDelivery[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
};

// Helper function to format dates
const formatDate = (dateString?: string): string => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return '—';
  }
};

const PreviewTable: React.FC<PreviewTableProps> = ({ 
  data, 
  currentPage, 
  totalPages, 
  itemsPerPage,
  setCurrentPage 
}) => {
  // Column definitions - preview columns to display
  const previewColumns = [
    { key: 'job_id', label: 'Job ID' },
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'delivering_driver', label: 'Driver' },
    { key: 'service_type', label: 'Service' },
    { key: 'cost', label: 'Cost' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created', format: formatDate }
  ];

  // Calculate pagination indexes
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {previewColumns.map(column => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item, index) => (
              <TableRow key={index}>
                {previewColumns.map(column => (
                  <TableCell key={`${index}-${column.key}`}>
                    {column.format 
                      ? column.format(item[column.key as keyof FoxDelivery] as string)
                      : column.key === 'cost'
                        ? item.cost ? `$${item.cost.toFixed(2)}` : '—'
                        : item[column.key as keyof FoxDelivery] || '—'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      {data.length > itemsPerPage && (
        <div className="flex items-center justify-between p-2 border-t">
          <div className="text-xs text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length} records
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewTable;
