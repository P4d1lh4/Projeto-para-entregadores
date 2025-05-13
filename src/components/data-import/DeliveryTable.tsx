
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowUpDown, Loader2 } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

type Column = {
  key: string;
  label: string;
  format?: (value: any) => string;
  sortable?: boolean;
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
  // State for sorting
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Column definitions - used to control which columns to display
  const columns: Column[] = [
    { key: 'job_id', label: 'Job ID', sortable: true },
    { key: 'customer_name', label: 'Customer', sortable: true },
    { key: 'company_name', label: 'Company', sortable: true },
    { key: 'delivering_driver', label: 'Driver', sortable: true },
    { key: 'delivery_address', label: 'Delivery Address', sortable: false },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'service_type', label: 'Service Type', sortable: true },
    { key: 'cost', label: 'Cost', sortable: true },
    { key: 'created_at', label: 'Created', format: formatDate, sortable: true }
  ];

  // Helper functions for page navigation
  const goToPreviousPage = () => {
    setCurrentPage(Math.max(currentPage - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(Math.min(currentPage + 1, totalPages));
  };

  // Sort function
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Apply sorting to items
  const getSortedItems = (items: FoxDelivery[]) => {
    if (!sortConfig) return items;
    
    return [...items].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof FoxDelivery];
      const bValue = b[sortConfig.key as keyof FoxDelivery];
      
      if (aValue === bValue) return 0;
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      // Special handling for dates
      if (sortConfig.key === 'created_at' || sortConfig.key === 'delivered_at' || sortConfig.key === 'accepted_at') {
        return sortConfig.direction === 'asc' 
          ? new Date(aValue as string).getTime() - new Date(bValue as string).getTime()
          : new Date(bValue as string).getTime() - new Date(aValue as string).getTime();
      }
      
      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string values
      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state
  if (deliveries.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No delivery records found. Use the Upload tab to import data.</p>
      </div>
    );
  }

  // Apply sorting and pagination
  const sortedDeliveries = getSortedItems(deliveries);
  const currentDeliveries = sortedDeliveries.slice(startIndex, endIndex);

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className="whitespace-nowrap">
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 font-medium text-muted-foreground hover:text-foreground -ml-3"
                        onClick={() => requestSort(column.key)}
                      >
                        {column.label}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentDeliveries.map((delivery, index) => (
                <TableRow key={delivery.id || index} className="hover:bg-muted/50">
                  {columns.map((column) => (
                    <TableCell key={`${delivery.id}-${column.key}`} className="whitespace-nowrap">
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
      
      {/* Improved pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, deliveries.length)} of {deliveries.length} records
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={goToPreviousPage}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  tabIndex={currentPage === 1 ? -1 : 0}
                  aria-disabled={currentPage === 1}
                />
              </PaginationItem>
              
              {/* Show page numbers with ellipsis for many pages */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show first page, last page, current page and neighbors
                let pageNumber: number | null = null;
                
                if (totalPages <= 5) {
                  // If 5 or fewer pages, show all
                  pageNumber = i + 1;
                } else if (i === 0) {
                  // First page
                  pageNumber = 1;
                } else if (i === 4) {
                  // Last page
                  pageNumber = totalPages;
                } else if (currentPage <= 2) {
                  // Near start
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 1) {
                  // Near end
                  pageNumber = totalPages - 4 + i;
                } else {
                  // Middle - show current page and neighbors
                  pageNumber = currentPage - 1 + i;
                }
                
                return (
                  <PaginationItem key={i}>
                    {pageNumber !== null ? (
                      <PaginationLink
                        isActive={currentPage === pageNumber}
                        onClick={() => setCurrentPage(pageNumber as number)}
                      >
                        {pageNumber}
                      </PaginationLink>
                    ) : (
                      <span className="flex h-9 w-5 items-center justify-center">...</span>
                    )}
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={goToNextPage}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  tabIndex={currentPage === totalPages ? -1 : 0}
                  aria-disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
};

export default DeliveryTable;
