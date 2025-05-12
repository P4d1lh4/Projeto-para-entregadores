
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DriverData } from '@/lib/file-utils';

type PerformanceChartProps = {
  data: DriverData[];
};

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  // Format data for chart
  const chartData = data.map(driver => ({
    name: driver.name.split(' ')[0], // Just use first name for brevity
    deliveries: driver.deliveries,
    successRate: Math.round(driver.successRate * 100),
    rating: driver.rating * 20, // Scale up for better visualization
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Driver Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="#0A4D68" />
            <YAxis yAxisId="right" orientation="right" stroke="#F97316" />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              formatter={(value, name) => {
                if (name === 'rating') {
                  return [`${(Number(value) / 20).toFixed(1)}/5`, 'Rating'];
                }
                if (name === 'successRate') {
                  return [`${value}%`, 'Success Rate'];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="deliveries" name="Deliveries" fill="#0A4D68" />
            <Bar yAxisId="right" dataKey="successRate" name="Success Rate %" fill="#F97316" />
            <Bar yAxisId="right" dataKey="rating" name="Rating" fill="#4ade80" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
