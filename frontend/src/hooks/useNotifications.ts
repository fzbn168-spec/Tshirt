import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

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

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!isAuthenticated() || !token) return [];
      // Axios does not support AbortSignal directly; for now, ignore signal
      const res = await api.get<Notification[]>('/notifications');
      return res.data;
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
       const res = await api.patch(`/notifications/${id}/read`);
       return res.data;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications']);
      if (previous) {
        const next = previous.map((n) => (n.id === id ? { ...n, isRead: true } : n));
        queryClient.setQueryData(['notifications'], next);
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['notifications'], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const res = await api.patch('/notifications/read-all');
      return res.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications']);
      if (previous) {
        const next = previous.map((n) => ({ ...n, isRead: true }));
        queryClient.setQueryData(['notifications'], next);
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['notifications'], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAsUnread = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/notifications/${id}/unread`);
      return res.data;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications']);
      if (previous) {
        const next = previous.map((n) => (n.id === id ? { ...n, isRead: false } : n));
        queryClient.setQueryData(['notifications'], next);
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['notifications'], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  return {
    notifications: data || [],
    unreadCount: (data || []).filter(n => !n.isRead).length,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    markAsUnread
  };
}
