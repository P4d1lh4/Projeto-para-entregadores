import React from 'react';
import type { FoxDelivery } from '@/types/delivery';
import { Building2, Package, BarChart3 } from 'lucide-react';

type DebugInfoProps = {
  data: FoxDelivery[];
};

const DebugInfo: React.FC<DebugInfoProps> = ({ data }) => {
  if (data.length === 0) return null;

  // Extract companies information
  const companies = data
    .map(d => d.company_name || d.customer_name)
    .filter(Boolean);
  
  const uniqueCompanies = [...new Set(companies)];
  
  // Count deliveries per company
  const companyStats = companies.reduce((acc: Record<string, number>, company: string) => {
    acc[company] = (acc[company] || 0) + 1;
    return acc;
  }, {});
  
  const topCompanies = Object.entries(companyStats)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5);

  // Status distribution
  const statusCounts = data.reduce((acc: Record<string, number>, delivery) => {
    const status = String(delivery.status || 'unknown');
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mt-6 space-y-4">
      {/* Companies Information */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h4 className="text-sm font-semibold text-blue-900">Companies Found</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-700 mb-2">
              <strong>{uniqueCompanies.length}</strong> unique companies detected
            </p>
            <p className="text-sm text-blue-700">
              <strong>{companies.length}</strong> total deliveries
            </p>
          </div>
          
          {topCompanies.length > 0 && (
            <div>
              <p className="text-xs font-medium text-blue-800 mb-2">Top Companies:</p>
              <div className="space-y-1">
                {topCompanies.map(([company, count]) => (
                  <div key={company} className="flex justify-between items-center text-xs">
                    <span className="text-blue-700 truncate max-w-[120px]" title={company}>
                      {company}
                    </span>
                    <span className="text-blue-600 font-medium">{count} deliveries</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Distribution */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-green-600" />
          <h4 className="text-sm font-semibold text-green-900">Delivery Status</h4>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <span 
              key={status}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium"
            >
              {String(status)}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Fields Detected */}
      <div className="p-4 bg-slate-50 border rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-5 w-5 text-slate-600" />
          <h4 className="text-sm font-semibold text-slate-900">Fields Detected</h4>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {Object.entries(data[0] || {})
            .filter(([_, value]) => value !== undefined && value !== null && value !== '')
            .map(([key]) => (
              <span 
                key={key} 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-200 text-slate-800 font-medium"
              >
                {key.replace(/_/g, ' ')}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DebugInfo;
