import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HeatMapPoint {
  lat: number;
  lng: number;
  intensity: number;
  region: string;
  deliveries: number;
}

interface SimpleHeatMapProps {
  points: HeatMapPoint[];
  width?: number;
  height?: number;
}

const SimpleHeatMap: React.FC<SimpleHeatMapProps> = ({ 
  points, 
  width = 600, 
  height = 400 
}) => {
  if (!points || points.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Calor das Entregas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Nenhum dado disponível para o mapa de calor
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate bounds
  const latitudes = points.map(p => p.lat);
  const longitudes = points.map(p => p.lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  // Add padding
  const latPadding = (maxLat - minLat) * 0.1;
  const lngPadding = (maxLng - minLng) * 0.1;

  const boundedMinLat = minLat - latPadding;
  const boundedMaxLat = maxLat + latPadding;
  const boundedMinLng = minLng - lngPadding;
  const boundedMaxLng = maxLng + lngPadding;

  // Convert coordinates to SVG coordinates
  const convertToSVG = (lat: number, lng: number) => {
    const x = ((lng - boundedMinLng) / (boundedMaxLng - boundedMinLng)) * width;
    const y = height - ((lat - boundedMinLat) / (boundedMaxLat - boundedMinLat)) * height;
    return { x, y };
  };

  // Get color based on intensity
  const getColor = (intensity: number) => {
    const colors = [
      '#3B82F6', // low intensity - blue
      '#10B981', // medium-low - green
      '#F59E0B', // medium - yellow
      '#EF4444', // high - red
      '#DC2626'  // very high - dark red
    ];
    
    const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
    return colors[index];
  };

  // Calculate max intensity for normalization
  const maxIntensity = Math.max(...points.map(p => p.intensity));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Calor das Entregas</CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>🔵 Baixa</span>
          <span>🟢 Média-Baixa</span>
          <span>🟡 Média</span>
          <span>🔴 Alta</span>
          <span>🟤 Muito Alta</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg width={width} height={height} className="border rounded-lg bg-gray-50">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#E5E7EB" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Heat points */}
            {points.map((point, index) => {
              const { x, y } = convertToSVG(point.lat, point.lng);
              const normalizedIntensity = point.intensity / maxIntensity;
              const radius = 15 + (normalizedIntensity * 25); // 15-40px radius
              const color = getColor(normalizedIntensity);
              
              return (
                <g key={index}>
                  {/* Glow effect */}
                  <circle
                    cx={x}
                    cy={y}
                    r={radius + 10}
                    fill={color}
                    opacity={0.2}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={radius + 5}
                    fill={color}
                    opacity={0.4}
                  />
                  {/* Main circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={color}
                    opacity={0.7}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-90 cursor-pointer"
                  >
                    <title>
                      {point.region}
                      {'\n'}Entregas: {point.deliveries}
                      {'\n'}Intensidade: {(normalizedIntensity * 100).toFixed(1)}%
                    </title>
                  </circle>
                  
                  {/* Label */}
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    className="fill-white text-xs font-medium pointer-events-none"
                    style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.7))' }}
                  >
                    {point.deliveries}
                  </text>
                </g>
              );
            })}
            
            {/* Legend */}
            <g transform={`translate(${width - 150}, 20)`}>
              <rect x="0" y="0" width="140" height="100" fill="white" stroke="#E5E7EB" rx="5" />
              <text x="10" y="15" className="text-xs font-medium">Intensidade</text>
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((intensity, i) => (
                <g key={i} transform={`translate(10, ${25 + i * 15})`}>
                  <circle r="6" fill={getColor(intensity)} />
                  <text x="15" y="4" className="text-xs">{(intensity * 100).toFixed(0)}%</text>
                </g>
              ))}
            </g>
          </svg>
        </div>
        
        {/* Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium">{points.length}</div>
            <div className="text-muted-foreground">Regiões</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{points.reduce((sum, p) => sum + p.deliveries, 0)}</div>
            <div className="text-muted-foreground">Total Entregas</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{Math.round(points.reduce((sum, p) => sum + p.deliveries, 0) / points.length)}</div>
            <div className="text-muted-foreground">Média/Região</div>
          </div>
          <div className="text-center">
            <div className="font-medium">
              {points.reduce((max, p) => p.deliveries > max.deliveries ? p : max).region}
            </div>
            <div className="text-muted-foreground">Região Top</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleHeatMap; 