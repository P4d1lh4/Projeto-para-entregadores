
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CustomerData } from '@/lib/file-utils';

type CustomersProps = {
  customerData: CustomerData[];
};

const Customers: React.FC<CustomersProps> = ({ customerData }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Customers</h1>
      <p className="text-muted-foreground">View and analyze customer metrics and insights.</p>
      
      <Card>
        <CardHeader>
          <CardTitle>Customer Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Deliveries</TableHead>
                <TableHead className="text-right">Average Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerData.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.address}</TableCell>
                  <TableCell>{customer.deliveries}</TableCell>
                  <TableCell className="text-right">{customer.averageRating}/5</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers;
