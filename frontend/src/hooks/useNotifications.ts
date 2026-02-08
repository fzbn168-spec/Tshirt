import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

export function useNotifications() {
  const { isAuthenticated, token, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async ({ signal }) => {
      if (!isAuthenticated() || !token) return [];
      try {
        const res = await fetch(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
          signal
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            console.warn('Unauthorized access in notifications, logging out...');
            throw new Error('Unauthorized');
          }
          throw new Error('Failed to fetch notifications');
        }
        return res.json() as Promise<Notification[]>;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Ignore abort errors
          return [];
        }
        throw err;
      }
    },
    enabled: isAuthenticated() && !!token,
    refetchInterval: 30000, // Poll every 30s
    retry: false, // Don't retry on failure, especially 401
  });

  useEffect(() => {
    if (error && error.message === 'Unauthorized') {
      logout();
      router.push('/login');
    }
  }, [error, logout, router]);

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
       const res = await fetch(`${API_URL}/notifications/${id}/read`, {
         method: 'PATCH',
         headers: { Authorization: `Bearer ${token}` }
       });
       if (!res.ok) throw new Error('Failed to mark as read');
       return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  return {
    notifications: data || [],
    unreadCount: (data || []).filter(n => !n.isRead).length,
    isLoading,
    error,
    markAsRead
  };
}
