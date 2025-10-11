'use client';

import React from 'react';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  showLegend?: boolean;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  size = 120,
  showLegend = true,
  className = ''
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div 
          className="rounded-full border-4 border-neutral-600 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-xs text-neutral-400">No Data</span>
        </div>
      </div>
    );
  }

  let cumulativePercentage = 0;
  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const startAngle = cumulativePercentage * 3.6; // Convert to degrees
    const endAngle = (cumulativePercentage + percentage) * 3.6;
    cumulativePercentage += percentage;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
    };
  });

  const createPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(0, 0, radius, endAngle);
    const end = polarToCartesian(0, 0, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", 0, 0,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const radius = size / 2 - 2;
  const viewBoxSize = size;

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
          <g transform={`translate(${size/2}, ${size/2})`}>
            {segments.map((segment, index) => (
              <path
                key={index}
                d={createPath(segment.startAngle, segment.endAngle, radius)}
                fill={segment.color}
                className="transition-opacity hover:opacity-80"
              />
            ))}
          </g>
        </svg>
        
        {/* Center text showing total */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{total}</div>
            <div className="text-xs text-neutral-300">Total</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="space-y-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <div className="text-xs text-neutral-300">
                <span className="font-medium">{segment.label}</span>
                <span className="text-neutral-400 ml-1">
                  ({segment.value}) {Math.round(segment.percentage)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
