import { useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

export const useAnalytics = () => {
  const { user } = useAuthStore();

  const trackEvent = useCallback(async (eventType: string, metadata: Record<string, unknown> = {}) => {
    try {
      const payload = {
        eventType,
        userId: user?.id, // Optional, backend handles null
        metadata: JSON.stringify(metadata),
        sessionId: getSessionId(), // Helper to get/set session cookie
      };

      api.post('/analytics/track', payload).catch(err => console.error('Analytics Error:', err));

    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [user]);

  return { trackEvent };
};

// Simple Session ID helper (persists in sessionStorage or localStorage)
function getSessionId() {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `sess_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}
