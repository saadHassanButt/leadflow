import { MailgunStats } from '@/lib/mailgun';

interface MailgunStatsGridProps {
  stats: MailgunStats;
  showMetrics?: boolean;
}

export function MailgunStatsGrid({ stats, showMetrics = true }: MailgunStatsGridProps) {
  const calculateDeliveryRate = (stats: MailgunStats): number => {
    if (stats.accepted === 0) return 0;
    return (stats.delivered / stats.accepted) * 100;
  };

  const calculateOpenRate = (stats: MailgunStats): number => {
    if (stats.delivered === 0) return 0;
    return (stats.opened / stats.delivered) * 100;
  };

  const calculateClickRate = (stats: MailgunStats): number => {
    if (stats.delivered === 0) return 0;
    return (stats.clicked / stats.delivered) * 100;
  };

  const calculateBounceRate = (stats: MailgunStats): number => {
    if (stats.accepted === 0) return 0;
    return (stats.failed / stats.accepted) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="text-3xl font-bold text-green-600">{stats.accepted}</div>
          <div className="text-sm text-green-700 font-medium">Accepted</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="text-3xl font-bold text-blue-600">{stats.delivered}</div>
          <div className="text-sm text-blue-700 font-medium">Delivered</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
          <div className="text-3xl font-bold text-orange-600">{stats.failed}</div>
          <div className="text-sm text-orange-700 font-medium">Failed</div>
        </div>
        <div className="text-center p-4 bg-teal-50 rounded-xl border border-teal-200">
          <div className="text-3xl font-bold text-teal-600">{stats.opened}</div>
          <div className="text-sm text-teal-700 font-medium">Opened</div>
        </div>
      </div>

      {showMetrics && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-white">Performance Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-300">Delivery Rate:</span>
                <span className="font-medium text-white">
                  {Math.round(calculateDeliveryRate(stats))}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">Open Rate:</span>
                <span className="font-medium text-white">
                  {Math.round(calculateOpenRate(stats))}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">Click Rate:</span>
                <span className="font-medium text-white">
                  {Math.round(calculateClickRate(stats))}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">Bounce Rate:</span>
                <span className="font-medium text-red-400">
                  {Math.round(calculateBounceRate(stats))}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-white">Engagement Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-300">Clicked:</span>
                <span className="font-medium text-blue-400">{stats.clicked}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">Complained:</span>
                <span className="font-medium text-yellow-400">{stats.complained}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">Unsubscribed:</span>
                <span className="font-medium text-red-400">{stats.unsubscribed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">Total Events:</span>
                <span className="font-medium text-neutral-400">{stats.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
