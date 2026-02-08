'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { useTranslations } from 'next-intl';
import { Bell, Check, Loader2 } from 'lucide-react';
import { Link } from '@/navigation';

export default function NotificationsPage() {
  const t = useTranslations('Common'); // Or a new namespace
  const { notifications, isLoading, markAsRead } = useNotifications();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Bell className="h-6 w-6" />
        Notifications
      </h1>

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className={`p-4 rounded-lg border transition-colors ${
                n.isRead 
                  ? 'bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800' 
                  : 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className={`font-medium ${!n.isRead ? 'text-blue-900 dark:text-blue-100' : ''}`}>
                    {n.title}
                  </h3>
                  <div 
                    className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 prose prose-sm max-w-none dark:prose-invert" 
                    dangerouslySetInnerHTML={{ __html: n.content }} 
                  />
                  <div className="text-xs text-zinc-400 mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                  
                  <div className="flex gap-4 mt-3">
                    {n.referenceId && n.referenceType === 'ORDER' && (
                        <Link href={`/dashboard/orders/${n.referenceId}`} className="text-sm font-medium text-blue-600 hover:underline">
                        View Order
                        </Link>
                    )}
                    {n.referenceId && n.referenceType === 'INQUIRY' && (
                        <Link href={`/dashboard/inquiries/${n.referenceId}`} className="text-sm font-medium text-blue-600 hover:underline">
                        View Inquiry
                        </Link>
                    )}
                  </div>
                </div>

                {!n.isRead && (
                  <button 
                    onClick={() => markAsRead.mutate(n.id)}
                    className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
