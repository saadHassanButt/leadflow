import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal';
  subtitle?: string;
  details?: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
  purple: 'bg-purple-100 text-purple-600',
  red: 'bg-red-100 text-red-600',
  teal: 'bg-teal-100 text-teal-600',
};

const textColorClasses = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  orange: 'text-orange-400',
  purple: 'text-purple-400',
  red: 'text-red-400',
  teal: 'text-teal-400',
};

export function StatsCard({ title, value, icon, color, subtitle, details }: StatsCardProps) {
  return (
    <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {subtitle && (
        <p className="text-sm text-neutral-300 mb-4">{subtitle}</p>
      )}
      {details && (
        <div className="space-y-2 text-sm text-neutral-300">
          {details.map((detail, index) => (
            <div key={index} className="flex justify-between">
              <span>{detail.label}:</span>
              <span className={detail.color || textColorClasses[color]}>
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
