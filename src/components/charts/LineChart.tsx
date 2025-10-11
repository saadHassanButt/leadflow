'use client';

import React from 'react';

interface LineChartData {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartData[];
  height?: number;
  color?: string;
  showPoints?: boolean;
  showGrid?: boolean;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  color = '#3b82f6',
  showPoints = true,
  showGrid = true,
  className = ''
}) => {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <span className="text-neutral-400 text-sm">No data available</span>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const valueRange = maxValue - minValue || 1; // Avoid division by zero
  
  const padding = 40;
  const chartWidth = 400;
  const chartHeight = height - padding * 2;
  
  // Calculate points for the line
  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (chartWidth - padding * 2);
    const y = padding + ((maxValue - item.value) / valueRange) * chartHeight;
    return { x, y, value: item.value, label: item.label };
  });

  // Create path string for the line
  const pathData = points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x} ${point.y}`;
  }, '');

  // Create area path (fill under the line)
  const areaPath = `${pathData} L ${points[points.length - 1]?.x || 0} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className={`w-full ${className}`}>
      <svg width={chartWidth} height={height} className="overflow-visible">
        {/* Grid lines */}
        {showGrid && (
          <g className="opacity-20">
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = padding + ratio * chartHeight;
              return (
                <line
                  key={`h-grid-${index}`}
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#6b7280"
                  strokeWidth="1"
                />
              );
            })}
            {/* Vertical grid lines */}
            {data.map((_, index) => {
              const x = padding + (index / Math.max(data.length - 1, 1)) * (chartWidth - padding * 2);
              return (
                <line
                  key={`v-grid-${index}`}
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={height - padding}
                  stroke="#6b7280"
                  strokeWidth="1"
                />
              );
            })}
          </g>
        )}

        {/* Area fill */}
        <path
          d={areaPath}
          fill={color}
          fillOpacity="0.1"
        />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {showPoints && points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill={color}
              stroke="#ffffff"
              strokeWidth="2"
              className="drop-shadow-sm"
            />
            {/* Value labels */}
            <text
              x={point.x}
              y={point.y - 12}
              textAnchor="middle"
              className="fill-white text-xs font-medium"
            >
              {point.value}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((item, index) => {
          const x = padding + (index / Math.max(data.length - 1, 1)) * (chartWidth - padding * 2);
          return (
            <text
              key={`label-${index}`}
              x={x}
              y={height - 10}
              textAnchor="middle"
              className="fill-neutral-300 text-xs"
            >
              {item.label}
            </text>
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = padding + ratio * chartHeight;
          const value = Math.round(maxValue - (ratio * valueRange));
          return (
            <text
              key={`y-label-${index}`}
              x={padding - 10}
              y={y + 4}
              textAnchor="end"
              className="fill-neutral-300 text-xs"
            >
              {value}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
