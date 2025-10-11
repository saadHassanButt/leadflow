'use client';

import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
  showPercentage?: boolean;
  showValue?: boolean;
  height?: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  color = '#f97316', // Orange-500
  showPercentage = true,
  showValue = false,
  height = 8,
  className = ''
}) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  
  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm text-neutral-300">{label}</span>
          )}
          <div className="text-sm text-neutral-300">
            {showValue && <span>{value}</span>}
            {showValue && showPercentage && <span className="mx-1">•</span>}
            {showPercentage && <span>{Math.round(percentage)}%</span>}
          </div>
        </div>
      )}
      
      <div 
        className="w-full bg-neutral-700 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};
