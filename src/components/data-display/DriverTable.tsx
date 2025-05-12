
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { DriverData } from '@/lib/file-utils';

type DriverTableProps = {
  drivers: DriverData[];
};

const DriverTable: React.FC<DriverTableProps> = ({ drivers }) => {
  // Sort by most deliveries
  const sortedDrivers = [...drivers].sort((a, b) => b.deliveries - a.deliveries);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Deliveries</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Avg Time (min)</TableHead>
              <TableHead className="text-right">Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDrivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">{driver.name}</TableCell>
                <TableCell>{driver.deliveries}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Progress value={driver.successRate * 100} className="w-[60px]" />
                    <span>{Math.round(driver.successRate * 100)}%</span>
                  </div>
                </TableCell>
                <TableCell>{driver.averageTime}</TableCell>
                <TableCell className="text-right">
                  <span className="font-medium">{driver.rating}</span>/5
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DriverTable;
