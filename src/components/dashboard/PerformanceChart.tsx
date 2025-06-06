import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Clock, Package } from 'lucide-react';
import type { DriverData } from '@/lib/file-utils';

type PerformanceChartProps = {
  data: DriverData[];
};

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sort drivers by success rate and take top 5
  const topDrivers = [...data]
    .sort((a, b) => (b.successRate || 0) - (a.successRate || 0))
    .slice(0, 5);

  // Format data for chart
  const chartData = topDrivers.map(driver => ({
    name: driver.name.split(' ')[0], // Just use first name for brevity
    deliveries: driver.deliveries,
    successRate: Math.round((driver.successRate || 0) * 100),
  }));

  const handleChartClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Card className="w-full cursor-pointer hover:shadow-lg transition-shadow" onClick={handleChartClick}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Top 5 Drivers - Best Success Rate
            <span className="text-sm font-normal text-muted-foreground">Click to view details</span>
          </CardTitle>
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
                  if (name === 'successRate') {
                    return [`${value}%`, 'Success Rate'];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="deliveries" name="Deliveries" fill="#0A4D68" />
              <Bar yAxisId="right" dataKey="successRate" name="Success Rate %" fill="#F97316" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Driver Performance Details
            </DialogTitle>
            <DialogDescription>
              Detailed performance metrics for the top 5 drivers with highest success rates
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Best Success Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {topDrivers.length > 0 ? Math.round((topDrivers[0].successRate || 0) * 100) : 0}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Deliveries</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {topDrivers.reduce((sum, driver) => sum + (driver.deliveries || 0), 0)}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Average Time</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {Math.round(topDrivers.reduce((sum, driver) => sum + (driver.averageTime || 0), 0) / topDrivers.length || 0)} min
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Driver List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Driver Rankings</h3>
              <div className="grid gap-4">
                {topDrivers.map((driver, index) => (
                  <Card key={driver.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold">{driver.name}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                              <div>
                                <p className="text-sm text-muted-foreground">Deliveries</p>
                                <p className="text-lg font-bold text-blue-600">{driver.deliveries || 0}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Success Rate</p>
                                <p className="text-lg font-bold text-green-600">
                                  {Math.round((driver.successRate || 0) * 100)}%
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Average Time</p>
                                <p className="text-lg font-bold text-purple-600">{(driver.averageTime || 0).toFixed(0)} min</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge variant="outline" className="text-center">
                            {(driver.successRate || 0) >= 0.9 ? 'Excellent' : 
                             (driver.successRate || 0) >= 0.8 ? 'Good' : 
                             (driver.successRate || 0) >= 0.7 ? 'Average' : 'Needs Improvement'}
                          </Badge>
                          {index === 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              🏆 Top Performer
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Enhanced Chart in Modal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#0A4D68" />
                  <YAxis yAxisId="right" orientation="right" stroke="#F97316" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(value, name) => {
                      if (name === 'successRate') {
                        return [`${value}%`, 'Success Rate'];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="deliveries" name="Deliveries" fill="#0A4D68" />
                  <Bar yAxisId="right" dataKey="successRate" name="Success Rate %" fill="#F97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PerformanceChart;
