'use client';

import React from 'react';

interface BarChartData {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  showValues?: boolean;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 200,
  showValues = true,
  className = ''
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-end justify-between space-x-2" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 40) : 0;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 min-w-0">
              <div className="relative flex items-end justify-center w-full mb-2">
                {showValues && item.value > 0 && (
                  <div className="absolute -top-6 text-xs font-medium text-white">
                    {item.value}
                  </div>
                )}
                <div
                  className="w-full rounded-t-md transition-all duration-500 ease-out"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: item.color,
                    minHeight: item.value > 0 ? '4px' : '0px'
                  }}
                />
              </div>
              <div className="text-xs text-neutral-300 text-center truncate w-full">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
