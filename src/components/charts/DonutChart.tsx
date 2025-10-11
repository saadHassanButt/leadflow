'use client';

import React from 'react';

interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  strokeWidth?: number;
  showPercentages?: boolean;
  centerContent?: React.ReactNode;
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 120,
  strokeWidth = 20,
  showPercentages = false,
  centerContent,
  className = ''
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
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
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercentage / 100 * circumference;
    cumulativePercentage += percentage;

    return {
      ...item,
      percentage,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#374151"
          strokeWidth={strokeWidth}
        />
        
        {/* Data segments */}
        {segments.map((segment, index) => (
          <circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={segment.strokeDasharray}
            strokeDashoffset={segment.strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        ))}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {centerContent || (
          <div className="text-center">
            <div className="text-lg font-bold text-white">{total}</div>
            <div className="text-xs text-neutral-300">Total</div>
          </div>
        )}
      </div>
      
      {/* Percentage labels */}
      {showPercentages && (
        <div className="absolute inset-0">
          {segments.map((segment, index) => {
            if (segment.percentage < 5) return null; // Don't show labels for very small segments
            
            const angle = (cumulativePercentage - segment.percentage / 2) * 3.6 - 90; // Convert to degrees and adjust for rotation
            const labelRadius = radius + strokeWidth / 2;
            const x = size / 2 + labelRadius * Math.cos(angle * Math.PI / 180);
            const y = size / 2 + labelRadius * Math.sin(angle * Math.PI / 180);
            
            return (
              <div
                key={index}
                className="absolute text-xs font-medium text-white transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: x, top: y }}
              >
                {Math.round(segment.percentage)}%
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
