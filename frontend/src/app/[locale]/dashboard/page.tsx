import { ArrowUpRight, Clock, FileText, Package } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const stats = [
    { name: 'Active Inquiries', value: '12', icon: FileText, change: '+2 this week', color: 'text-blue-600 bg-blue-50' },
    { name: 'Pending Orders', value: '3', icon: Clock, change: '1 awaiting payment', color: 'text-orange-600 bg-orange-50' },
    { name: 'Total Orders', value: '45', icon: Package, change: '+15% vs last month', color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-50`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-zinc-500">{stat.name}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Inquiries */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold">Recent Inquiries</h2>
            <Link href="/dashboard/inquiries" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-sm">RFQ-2024-00{i}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                    Pending Quote
                  </span>
                </div>
                <div className="text-sm text-zinc-500 mb-2">
                  Men&apos;s Hiking Boots, Sports Running Shoes...
                </div>
                <div className="text-xs text-zinc-400">
                  Submitted on Feb 0{i}, 2026
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Notifications */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="font-semibold">Notifications</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex gap-4">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-600 shrink-0" />
              <div>
                <div className="text-sm font-medium mb-1">New Product Catalog Available</div>
                <p className="text-xs text-zinc-500">The Spring/Summer 2026 collection is now available for browsing.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-2 mt-2 rounded-full bg-zinc-300 shrink-0" />
              <div>
                <div className="text-sm font-medium mb-1">System Maintenance</div>
                <p className="text-xs text-zinc-500">Scheduled maintenance on Feb 15th, 02:00 UTC.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
