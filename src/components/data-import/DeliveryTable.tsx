
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { FoxDelivery } from '@/types/delivery';

// Helper function to format dates
const formatDate = (dateString?: string): string => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return '—';
  }
};

type DeliveryTableProps = {
  deliveries: FoxDelivery[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  setCurrentPage: (page: number) => void;
  isLoading: boolean;
};

const DeliveryTable: React.FC<DeliveryTableProps> = ({
  deliveries,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  setCurrentPage,
  isLoading
}) => {
  // Column definitions - used to control which columns to display
  const columns = [
    { key: 'job_id', label: 'Job ID' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'company_name', label: 'Company' },
    { key: 'delivering_driver', label: 'Driver' },
    { key: 'delivery_address', label: 'Delivery Address' },
    { key: 'status', label: 'Status' },
    { key: 'service_type', label: 'Service Type' },
    { key: 'cost', label: 'Cost' },
    { key: 'created_at', label: 'Created', format: formatDate }
  ];

  if (isLoading || deliveries.length === 0) {
    return null;
  }

  const currentDeliveries = deliveries.slice(startIndex, endIndex);

  // Helper functions for page navigation
  const goToPreviousPage = () => {
    setCurrentPage(Math.max(currentPage - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(Math.min(currentPage + 1, totalPages));
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentDeliveries.map((delivery, index) => (
                <TableRow key={delivery.id || index}>
                  {columns.map((column) => (
                    <TableCell key={`${delivery.id}-${column.key}`}>
                      {column.format 
                        ? column.format(delivery[column.key as keyof FoxDelivery] as string)
                        : column.key === 'cost' 
                          ? delivery.cost ? `$${delivery.cost.toFixed(2)}` : '—'
                          : delivery[column.key as keyof FoxDelivery] || '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, deliveries.length)} of {deliveries.length} records
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default DeliveryTable;
