'use client';

import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { Bell, Check, Loader2, HelpCircle } from 'lucide-react';
import { Link } from '@/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const { notifications: allNotifications, markAsRead, markAllAsRead, markAsUnread } = useNotifications();
  const globalUnread = useMemo(
    () => (allNotifications || []).filter((n) => !n.isRead).length,
    [allNotifications]
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'all' | 'unread'>((searchParams.get('tab') as 'all' | 'unread') || 'all');
  const [type, setType] = useState<string>(searchParams.get('type') || '');
  const [refType, setRefType] = useState<string>(searchParams.get('referenceType') || '');
  const [q, setQ] = useState<string>(searchParams.get('q') || '');
  const [startDate, setStartDate] = useState<string>(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState<string>(searchParams.get('endDate') || '');

  const [items, setItems] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string; undo?: () => Promise<void> } | null>(null);
  const [undoInfo, setUndoInfo] = useState<{ ids: string[]; type: 'read' | 'unread' } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpCopied, setHelpCopied] = useState(false);
  const [menu, setMenu] = useState<{ open: boolean; x: number; y: number; id: string | null }>({
    open: false,
    x: 0,
    y: 0,
    id: null,
  });
  const [mutedTypes, setMutedTypes] = useState<Set<string>>(() => {
    try {
      const mutedParam = searchParams.get('muted');
      if (mutedParam) {
        const arrFromUrl = mutedParam.split(',').map((s) => s.trim()).filter(Boolean);
        return new Set(arrFromUrl);
      }
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem('notif:mutedTypes') : null;
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      return new Set(arr);
    } catch {
      return new Set();
    }
  });

  const renderHighlighted = (text: string) => {
    if (!q) return text;
    try {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(${escaped})`, 'ig');
      const parts = text.split(re);
      return parts.map((part, idx) =>
        re.test(part) ? (
          <mark key={`m-${idx}`} className="bg-yellow-200 dark:bg-yellow-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={`t-${idx}`}>{part}</span>
        )
      );
    } catch {
      return text;
    }
  };

  useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (target?.isContentEditable ?? false)) return;
      if (menu.open && e.key === 'Escape') {
        e.preventDefault();
        setMenu({ open: false, x: 0, y: 0, id: null });
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }
      if (helpOpen && e.key === 'Escape') {
        e.preventDefault();
        setHelpOpen(false);
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === 'Escape') {
        setSelected(new Set());
        return;
      }
      if (e.key === 'Home' || e.key === 'End') {
        if (items.length > 0) {
          e.preventDefault();
          setActiveIndex(e.key === 'Home' ? 0 : items.length - 1);
        }
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (items.length > 0) {
          e.preventDefault();
          setActiveIndex((prev) => {
            const next = e.key === 'ArrowDown' ? prev + 1 : prev - 1;
            if (next < 0) return 0;
            if (next >= items.length) return items.length - 1;
            return next;
          });
        }
        return;
      }
      if (bulkBusy) return;
      if (e.key === 'z') {
        if (undoInfo) {
          const ids = undoInfo.ids;
          if (undoInfo.type === 'read') {
            setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: false } : n)));
            await Promise.all(ids.map((id) => markAsUnread.mutateAsync(id)));
          } else {
            setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)));
            await Promise.all(ids.map((id) => markAsRead.mutateAsync(id)));
          }
          setUndoInfo(null);
          setToast({ type: 'success', message: 'Undone' });
        } else if (toast?.undo) {
          await toast.undo();
          setToast({ type: 'success', message: 'Undone' });
        }
        return;
      }
      if (e.key === 'a') {
        if (items.length > 0) {
          e.preventDefault();
          setSelected(new Set(items.map((n) => n.id)));
        }
        return;
      }
      if (e.key === 'c') {
        e.preventDefault();
        setSelected(new Set());
        return;
      }
      if (e.key === ' ') {
        if (items.length > 0) {
          e.preventDefault();
          const n = items[activeIndex];
          if (n) {
            setSelected((prev) => {
              const next = new Set(prev);
              if (next.has(n.id)) next.delete(n.id);
              else next.add(n.id);
              return next;
            });
            setLastSelectedIndex(activeIndex);
          }
        }
        return;
      }
      if (e.key === 'o') {
        if (items.length > 0) {
          e.preventDefault();
          const n = items[activeIndex];
          if (n && n.referenceId && n.referenceType) {
            let href: string | null = null;
            if (n.referenceType === 'ORDER') href = `/dashboard/orders/${n.referenceId}`;
            else if (n.referenceType === 'INQUIRY') href = `/dashboard/inquiries/${n.referenceId}`;
            else if (n.referenceType === 'PAYMENT') href = `/dashboard/orders/${n.referenceId}`;
            else if (n.referenceType === 'SHIPPING') href = `/dashboard/orders/${n.referenceId}`;
            else if (n.referenceType === 'PRODUCT') href = `/product/${n.referenceId}`;
            else if (n.referenceType === 'COMPANY') href = `/dashboard/profile`;
            if (href) {
              if (e.ctrlKey || e.metaKey) {
                window.open(href, '_blank');
              } else {
                router.push(href);
              }
            }
          }
        }
        return;
      }
      if (e.key === 'r' && selected.size > 0) {
        const ids = Array.from(selected);
        setBulkError(null);
        setBulkBusy(true);
        try {
          setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)));
          setUndoInfo({ ids, type: 'read' });
          await Promise.all(ids.map((id) => markAsRead.mutateAsync(id)));
          setSelected(new Set());
          setBulkSuccess(`Marked ${ids.length} as read • Press z to undo`);
          setTimeout(() => setBulkSuccess(null), 2000);
          setToast({
            type: 'success',
            message: `Marked ${ids.length} as read`,
            undo: async () => {
              const current = undoInfo;
              const targetIds = current?.ids ?? ids;
              setItems((prev) => prev.map((n) => (targetIds.includes(n.id) ? { ...n, isRead: false } : n)));
              await Promise.all(targetIds.map((id) => markAsUnread.mutateAsync(id)));
              setUndoInfo(null);
            },
          });
        } catch {
          setBulkError('Failed to mark selected as read');
          setToast({ type: 'error', message: 'Failed to mark selected as read' });
        } finally {
          setBulkBusy(false);
        }
      } else if (e.key === 'u' && selected.size > 0) {
        const ids = Array.from(selected);
        setBulkError(null);
        setBulkBusy(true);
        try {
          setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: false } : n)));
          setUndoInfo({ ids, type: 'unread' });
          await Promise.all(ids.map((id) => markAsUnread.mutateAsync(id)));
          setSelected(new Set());
          setBulkSuccess(`Marked ${ids.length} as unread • Press z to undo`);
          setTimeout(() => setBulkSuccess(null), 2000);
          setToast({
            type: 'success',
            message: `Marked ${ids.length} as unread`,
            undo: async () => {
              const current = undoInfo;
              const targetIds = current?.ids ?? ids;
              setItems((prev) => prev.map((n) => (targetIds.includes(n.id) ? { ...n, isRead: true } : n)));
              await Promise.all(targetIds.map((id) => markAsRead.mutateAsync(id)));
              setUndoInfo(null);
            },
          });
        } catch {
          setBulkError('Failed to mark selected as unread');
          setToast({ type: 'error', message: 'Failed to mark selected as unread' });
        } finally {
          setBulkBusy(false);
        }
      } else if (e.key === 'r' && selected.size === 0) {
        if (items.length === 0) return;
        const n = items[activeIndex];
        if (!n || n.isRead) return;
        setItems((prev) => prev.map((x, i) => (i === activeIndex ? { ...x, isRead: true } : x)));
        try {
          await markAsRead.mutateAsync(n.id);
          setToast({
            type: 'success',
            message: 'Marked 1 as read',
            undo: async () => {
              setItems((prev) => prev.map((x, i) => (i === activeIndex ? { ...x, isRead: false } : x)));
              await markAsUnread.mutateAsync(n.id);
            },
          });
        } catch {
          setItems((prev) => prev.map((x, i) => (i === activeIndex ? { ...x, isRead: false } : x)));
          setToast({ type: 'error', message: 'Failed to mark as read' });
        }
      } else if (e.key === 'u' && selected.size === 0) {
        if (items.length === 0) return;
        const n = items[activeIndex];
        if (!n || !n.isRead) return;
        setItems((prev) => prev.map((x, i) => (i === activeIndex ? { ...x, isRead: false } : x)));
        try {
          await markAsUnread.mutateAsync(n.id);
          setToast({
            type: 'success',
            message: 'Marked 1 as unread',
            undo: async () => {
              setItems((prev) => prev.map((x, i) => (i === activeIndex ? { ...x, isRead: true } : x)));
              await markAsRead.mutateAsync(n.id);
            },
          });
        } catch {
          setItems((prev) => prev.map((x, i) => (i === activeIndex ? { ...x, isRead: true } : x)));
          setToast({ type: 'error', message: 'Failed to mark as unread' });
        }
      } else if (e.key === 'Enter') {
        if (items.length > 0) {
          const idx = e.shiftKey ? Math.min(items.length - 1, activeIndex + 1) : activeIndex;
          const n = items[idx];
          if (n.referenceId && n.referenceType) {
            if (!n.isRead) {
              setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, isRead: true } : x)));
              markAsRead.mutateAsync(n.id).catch(() => {
                setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, isRead: false } : x)));
              });
            }
            let href: string | null = null;
            if (n.referenceType === 'ORDER') href = `/dashboard/orders/${n.referenceId}`;
            else if (n.referenceType === 'INQUIRY') href = `/dashboard/inquiries/${n.referenceId}`;
            else if (n.referenceType === 'PAYMENT') href = `/dashboard/orders/${n.referenceId}`;
            else if (n.referenceType === 'SHIPPING') href = `/dashboard/orders/${n.referenceId}`;
            else if (n.referenceType === 'PRODUCT') href = `/product/${n.referenceId}`;
            else if (n.referenceType === 'COMPANY') href = `/dashboard/profile`;
            if (href) {
              if (e.ctrlKey || e.metaKey) {
                window.open(href, '_blank');
              } else {
                router.push(href);
              }
            }
          }
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected, bulkBusy, markAsRead, markAsUnread, undoInfo, items, router, activeIndex, toast, helpOpen, menu.open]);

  

  useEffect(() => {
    if (items.length > 0) setActiveIndex(0);
  }, [items.length]);

  useEffect(() => {
    if (items.length === 0) return;
    const current = items[activeIndex];
    if (!current) return;
    const el = document.getElementById(`notif-option-${current.id}`);
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, items]);

  const updateQuery = useCallback(
    (next: { tab?: 'all' | 'unread'; type?: string; referenceType?: string; q?: string; startDate?: string; endDate?: string; muted?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.tab !== undefined) {
        params.set('tab', next.tab);
      }
      if (next.type !== undefined) {
        if (next.type) params.set('type', next.type);
        else params.delete('type');
      }
      if (next.referenceType !== undefined) {
        if (next.referenceType) params.set('referenceType', next.referenceType);
        else params.delete('referenceType');
      }
      if (next.q !== undefined) {
        if (next.q) params.set('q', next.q);
        else params.delete('q');
      }
      if (next.startDate !== undefined) {
        if (next.startDate) params.set('startDate', next.startDate);
        else params.delete('startDate');
      }
      if (next.endDate !== undefined) {
        if (next.endDate) params.set('endDate', next.endDate);
        else params.delete('endDate');
      }
      if (next.muted !== undefined) {
        const v = (next.muted || '').trim();
        if (v) params.set('muted', v);
        else params.delete('muted');
      }
      router.replace(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    try {
      sessionStorage.setItem('notif:mutedTypes', JSON.stringify(Array.from(mutedTypes)));
    } catch {}
    updateQuery({ muted: Array.from(mutedTypes).join(',') });
  }, [mutedTypes, updateQuery]);

  const resetAndFetch = () => {
    setItems([]);
    setPage(1);
    setTotal(null);
    setHasMore(true);
    setSelected(new Set());
  };

  useEffect(() => {
    resetAndFetch();
    // 保存筛选到 URL
    updateQuery({ tab, type, referenceType: refType, q, startDate, endDate });
    // 保存筛选与页码到 sessionStorage，便于返回定位
    const key = `notif:state:${tab}:${type}:${refType}:${q}:${startDate}:${endDate}`;
    sessionStorage.setItem(key, JSON.stringify({ page: 1 }));
  }, [tab, type, refType, q, startDate, endDate, updateQuery]);

  useEffect(() => {
    const fetchPage = async () => {
      if (!hasMore || loading) return;
      setLoading(true);
      try {
        const res = await api.get<Notification[]>('/notifications', {
          params: {
            page,
            limit: PAGE_SIZE,
            isRead: tab === 'unread' ? 'false' : undefined,
            type: type || undefined,
            referenceType: refType || undefined,
            q: q || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          },
        });
        const list = res.data || [];
        const headerTotal = res.headers?.['x-total-count'];
        if (total === null && headerTotal && !Number.isNaN(Number(headerTotal))) {
          setTotal(Number(headerTotal));
        }
        setItems((prev) => [...prev, ...list]);
        if (total !== null && (items.length + list.length) >= total) setHasMore(false);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [page, tab, type, refType, q, startDate, endDate, hasMore, loading, total, items.length]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  // 首次进入时尝试恢复到上次浏览页码（按当前筛选组合）
  useEffect(() => {
    const key = `notif:state:${tab}:${type}:${refType}:${q}:${startDate}:${endDate}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { page?: number };
      if (parsed.page && parsed.page > 1) {
        // 依次拉取至目标页
        (async () => {
          setItems([]);
          setHasMore(true);
          setLoading(true);
          try {
            let combined: Notification[] = [];
            const target = parsed.page as number;
            for (let p = 1; p <= target; p++) {
              const res = await api.get<Notification[]>('/notifications', {
                params: {
                  page: p,
                  limit: PAGE_SIZE,
                  isRead: tab === 'unread' ? 'false' : undefined,
                  type: type || undefined,
                  referenceType: refType || undefined,
                  q: q || undefined,
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                },
              });
              const list = res.data || [];
              combined = [...combined, ...list];
              if (list.length < PAGE_SIZE) {
                setHasMore(false);
                break;
              }
            }
            setItems(combined);
            setPage(target);
          } finally {
            setLoading(false);
          }
        })();
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // 保存当前页到 sessionStorage
  useEffect(() => {
    const key = `notif:state:${tab}:${type}:${refType}:${q}:${startDate}:${endDate}`;
    const raw = sessionStorage.getItem(key);
    const prev = raw ? JSON.parse(raw) : {};
    sessionStorage.setItem(key, JSON.stringify({ ...prev, page }));
  }, [page, tab, type, refType, q, startDate, endDate]);

  const [types, setTypes] = useState<string[]>([]);
  const [refTypes, setRefTypes] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    api
      .get<string[]>('/notifications/types')
      .then((res) => {
        if (mounted) setTypes(res.data || []);
      })
      .catch(() => {});
    api
      .get<string[]>('/notifications/reference-types')
      .then((res) => {
        if (mounted) setRefTypes(res.data || []);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = {
      isRead: tab === 'unread' ? 'false' : undefined,
      type: type || undefined,
      referenceType: refType || undefined,
      q: q || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    api
      .get<{ count: number } | number>('/notifications/count', { params })
      .then((res) => {
        const data = res.data as { count: number } | number;
        const c = typeof data === 'number' ? data : data.count;
        if (!cancelled) {
          setTotal(c);
          if (items.length >= c) setHasMore(false);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tab, type, refType, q, startDate, endDate, items.length]);

  const getReferenceLink = (n: Notification): { href: string; label: string } | null => {
    if (n.referenceId && n.referenceType === 'ORDER') {
      return { href: `/dashboard/orders/${n.referenceId}`, label: 'View Order' };
    }
    if (n.referenceId && n.referenceType === 'INQUIRY') {
      return { href: `/dashboard/inquiries/${n.referenceId}`, label: 'View Inquiry' };
    }
    if (n.referenceId && n.referenceType === 'PAYMENT') {
      return { href: `/dashboard/orders/${n.referenceId}`, label: 'View Payment' };
    }
    if (n.referenceId && n.referenceType === 'SHIPPING') {
      return { href: `/dashboard/orders/${n.referenceId}`, label: 'View Shipping' };
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notifications
        </h1>
        <div className="flex-1 max-w-md mx-6 flex items-center gap-2">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // 回车触发筛选
                resetAndFetch();
                updateQuery({ q });
              }
            }}
            ref={searchRef}
            placeholder="Search title or content"
            className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm"
          />
          <button
            onClick={() => {
              resetAndFetch();
              updateQuery({ q });
            }}
            className="px-3 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
          >
            Search
          </button>
        </div>
        <button
          disabled={!globalUnread || markAllAsRead.isPending}
          onClick={async () => {
            setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
            try {
              await markAllAsRead.mutateAsync();
              setToast({ type: 'success', message: 'Marked all as read' });
            } catch {
              setToast({ type: 'error', message: 'Failed to mark all as read' });
            }
          }}
          className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white disabled:opacity-50"
        >
          {markAllAsRead.isPending ? 'Marking...' : `Mark all as read ${globalUnread ? `(${globalUnread})` : ''}`}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-300 mr-2" role="status" aria-live="polite">
          {total !== null ? `Total: ${total}` : 'Total: -'} • Selected: {selected.size}
        </span>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Shortcuts: r/u/ESC/↑↓/Enter, Shift+Enter, Home/End, Space/a/c/o
        </span>
        {selected.size > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            r=read • u=unread
          </span>
        )}
        {undoInfo && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            z=undo
          </span>
        )}
        {items.length > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            Space=select • a=select page • c=clear • o=open
          </span>
        )}
        {mutedTypes.size > 0 && (
          <>
            <span className="mx-2 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Muted:</span>
            {Array.from(mutedTypes).map((t) => (
              <button
                key={t}
                onClick={() => {
                  const next = new Set(mutedTypes);
                  next.delete(t);
                  setMutedTypes(next);
                }}
                className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:opacity-80"
                title="Unmute this type"
              >
                {t} ×
              </button>
            ))}
            <button
              onClick={() => setMutedTypes(new Set())}
              className="text-[11px] px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              title="Unmute all types"
            >
              Unmute all
            </button>
          </>
        )}
        {selected.size > 0 && (
          <>
            <button
              disabled={bulkBusy}
              onClick={async () => {
                const ids = Array.from(selected);
                setBulkError(null);
                setBulkBusy(true);
                try {
                  setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)));
                  setUndoInfo({ ids, type: 'read' });
                  await Promise.all(ids.map((id) => markAsRead.mutateAsync(id)));
                  setSelected(new Set());
                  setBulkSuccess(`Marked ${ids.length} as read • Press z to undo`);
                  setTimeout(() => setBulkSuccess(null), 2000);
                  setToast({
                    type: 'success',
                    message: `Marked ${ids.length} as read`,
                    undo: async () => {
                      const current = undoInfo;
                      const targetIds = current?.ids ?? ids;
                      setItems((prev) => prev.map((n) => (targetIds.includes(n.id) ? { ...n, isRead: false } : n)));
                      await Promise.all(targetIds.map((id) => markAsUnread.mutateAsync(id)));
                      setUndoInfo(null);
                    },
                  });
                } catch {
                  setBulkError('Failed to mark selected as read');
                  setToast({ type: 'error', message: 'Failed to mark selected as read' });
                } finally {
                  setBulkBusy(false);
                }
              }}
              className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white disabled:opacity-50"
            >
              Mark selected read ({selected.size})
            </button>
            <button
              disabled={bulkBusy}
              onClick={async () => {
                const ids = Array.from(selected);
                setBulkError(null);
                setBulkBusy(true);
                try {
                  setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: false } : n)));
                  setUndoInfo({ ids, type: 'unread' });
                  await Promise.all(ids.map((id) => markAsUnread.mutateAsync(id)));
                  setSelected(new Set());
                  setBulkSuccess(`Marked ${ids.length} as unread • Press z to undo`);
                  setTimeout(() => setBulkSuccess(null), 2000);
                  setToast({
                    type: 'success',
                    message: `Marked ${ids.length} as unread`,
                    undo: async () => {
                      const current = undoInfo;
                      const targetIds = current?.ids ?? ids;
                      setItems((prev) => prev.map((n) => (targetIds.includes(n.id) ? { ...n, isRead: true } : n)));
                      await Promise.all(targetIds.map((id) => markAsRead.mutateAsync(id)));
                      setUndoInfo(null);
                    },
                  });
                } catch {
                  setBulkError('Failed to mark selected as unread');
                  setToast({ type: 'error', message: 'Failed to mark selected as unread' });
                } finally {
                  setBulkBusy(false);
                }
              }}
              className="text-sm px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 disabled:opacity-50"
            >
              Mark selected unread
            </button>
            <button
              disabled={bulkBusy}
              onClick={() => setSelected(new Set())}
              className="text-sm px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 disabled:opacity-50"
            >
              Clear selected
            </button>
            <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
              {bulkBusy && <span className="text-xs text-zinc-500">Processing...</span>}
              {bulkError && <span className="text-xs text-red-600">{bulkError}</span>}
              {bulkSuccess && <span className="text-xs text-green-600">{bulkSuccess}</span>}
            </span>
            <span className="mx-2 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
          </>
        )}
        {items.length > 0 && (
          <>
            <button
              disabled={bulkBusy}
              onClick={() => {
                const ids = items.map((x) => x.id);
                setSelected(new Set(ids));
              }}
              className="text-sm px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 disabled:opacity-50"
            >
              Select page
            </button>
            <button
              disabled={bulkBusy}
              onClick={() => setSelected(new Set())}
              className="text-sm px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 disabled:opacity-50"
            >
              Deselect
            </button>
            <span className="mx-2 h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
          </>
        )}
        <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 text-sm ${tab === 'all' ? 'bg-zinc-200 dark:bg-zinc-800' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'}`}
          >
            All
          </button>
          <button
            onClick={() => setTab('unread')}
            className={`px-3 py-1.5 text-sm ${tab === 'unread' ? 'bg-zinc-200 dark:bg-zinc-800' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'}`}
          >
            Unread
          </button>
        </div>
        <select
          className="px-2 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="text-xs text-zinc-500 ml-2" title="r/u 标记读未读 • ESC 清空 • ↑↓/Enter 列表导航 • Shift+Enter 打开下一条 • Home/End 跳首尾 • Space/a/c/o 选择/全选/清空/打开 • / 聚焦搜索">
          Shortcuts: r/u • ESC • ↑↓/Enter • Shift+Enter • Home/End • Space/a/c/o • /
        </span>
        <select
          className="px-2 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
          value={refType}
          onChange={(e) => setRefType(e.target.value)}
        >
          <option value="">All references</option>
          {refTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-2 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        />
        <span className="text-sm text-zinc-500">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-2 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        />
        <button
          onClick={() => {
            setMutedTypes(new Set());
            resetAndFetch();
            updateQuery({ muted: '' });
          }}
          title="Reset 会清空静音类型"
          className="ml-2 text-sm px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
        >
          Reset
        </button>
        <button
          onClick={() => {
            setTab('all');
            setType('');
            setRefType('');
            setQ('');
            setStartDate('');
            setEndDate('');
            setMutedTypes(new Set());
            resetAndFetch();
            updateQuery({ tab: 'all', type: '', referenceType: '', q: '', startDate: '', endDate: '', muted: '' });
          }}
          title="Clear 会清空静音类型"
          className="text-sm px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
        >
          Clear
        </button>
        <button
          onClick={() => setHelpOpen((v) => !v)}
          aria-label="快捷键说明"
          title="快捷键：r/u 标记读未读；ESC 清空选择；↑↓/Enter 导航并打开；Shift+Enter 打开下一条；Home/End 首尾；Space/a/c 选择/全选/清空；o 打开；Ctrl/⌘ 配合新标签页；/ 聚焦搜索"
          className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
          type="button"
        >
          <HelpCircle className="h-4 w-4" />
          Help
        </button>
      </div>

      {items.length === 0 && !loading ? (
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500">
            {q || type || refType || startDate || endDate
              ? `No results${q ? ` for “${q}”` : ''}.`
              : 'No notifications.'}
          </p>
          {(q || type || refType || startDate || endDate) && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setTab('all');
                  setType('');
                  setRefType('');
                  setQ('');
                  setStartDate('');
                  setEndDate('');
                  setMutedTypes(new Set());
                  resetAndFetch();
                  updateQuery({ tab: 'all', type: '', referenceType: '', q: '', startDate: '', endDate: '', muted: '' });
                }}
                className="px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          className="space-y-4"
          role="listbox"
          aria-label="Notifications"
          tabIndex={0}
          aria-activedescendant={items.length > 0 ? `notif-option-${items[activeIndex].id}` : undefined}
          aria-keyshortcuts="ArrowUp ArrowDown Home End Enter Shift+Enter r u Escape Space a c o / ?"
        >
          {items.map((n, idx) => (
            <div
              key={n.id}
              id={`notif-option-${n.id}`}
              className={`rounded-lg border transition-colors transition-all ${
                n.isRead
                  ? 'bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800'
                  : 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
              } ${idx === activeIndex ? 'ring-2 ring-blue-300 dark:ring-blue-700' : ''} ${
                (tab === 'unread' && n.isRead) || mutedTypes.has(n.type)
                  ? 'opacity-0 max-h-0 p-0 m-0 overflow-hidden duration-300 pointer-events-none'
                  : 'p-4 duration-200'
              }`}
              onMouseMove={() => setActiveIndex(idx)}
              onContextMenu={(e) => {
                e.preventDefault();
                setActiveIndex(idx);
                setMenu({ open: true, x: e.clientX, y: e.clientY, id: n.id });
              }}
              aria-selected={idx === activeIndex}
              role="option"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 text-xs text-zinc-500 mb-1" title="Shift+Click to select a range">
                    <input
                      type="checkbox"
                      checked={selected.has(n.id)}
                      onChange={(e) => {
                        let isShift = false;
                        const nev = e.nativeEvent as unknown;
                        if (nev && typeof nev === 'object' && 'shiftKey' in nev) {
                          isShift = (nev as { shiftKey: boolean }).shiftKey === true;
                        }
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (isShift && lastSelectedIndex !== null) {
                            const start = Math.min(lastSelectedIndex, idx);
                            const end = Math.max(lastSelectedIndex, idx);
                            if (e.target.checked) {
                              for (let i = start; i <= end; i++) next.add(items[i].id);
                            } else {
                              for (let i = start; i <= end; i++) next.delete(items[i].id);
                            }
                          } else {
                            if (e.target.checked) next.add(n.id);
                            else next.delete(n.id);
                          }
                          return next;
                        });
                        setLastSelectedIndex(idx);
                      }}
                    />
                    Select
                  </label>
                  <h3 className={`font-medium ${!n.isRead ? 'text-blue-900 dark:text-blue-100' : ''}`}>{renderHighlighted(n.title)}</h3>
                  <div
                    className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: n.content }}
                  />
                  <div
                    className="text-xs text-zinc-400 mt-2"
                    title={new Date(n.createdAt).toString()}
                  >
                    {new Date(n.createdAt).toLocaleString()}
                  </div>

                  <div className="flex gap-4 mt-3">
                    {(() => {
                      const ref = getReferenceLink(n);
                      if (!ref) return null;
                      return (
                        <Link
                          href={ref.href}
                          className="text-sm font-medium text-blue-600 hover:underline"
                          onClick={() => {
                            if (!n.isRead) {
                              setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
                              markAsRead.mutate(n.id);
                            }
                          }}
                        >
                          {ref.label}
                        </Link>
                      );
                    })()}
                  </div>
                </div>

                {n.isRead ? (
                  <button
                    onClick={() => {
                      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: false } : x)));
                      markAsUnread.mutate(n.id);
                    }}
                    className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors text-xs"
                    title="Mark as unread (Shortcut: u)"
                    aria-keyshortcuts="u"
                  >
                    Unread
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
                      markAsRead.mutate(n.id);
                    }}
                    className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                    title="Mark as read (Shortcut: r)"
                    aria-keyshortcuts="r"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="flex justify-center">
            {loading ? (
              <div className="py-4">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : hasMore ? (
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-sm"
                title={total != null ? `${Math.max(0, total - items.length)} left` : 'Load more'}
              >
                {total != null ? `Load more (${Math.max(0, total - items.length)} left)` : 'Load more'}
              </button>
            ) : (
              <div className="py-4 text-sm text-zinc-500">No more notifications</div>
            )}
          </div>
        </div>
      )}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 px-3 py-2 rounded-md shadow ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm">{toast.message}</span>
            {toast.undo && (
              <button
                onClick={async () => {
                  try {
                    await toast.undo?.();
                    setToast({ type: 'success', message: 'Undone' });
                  } catch {
                    setToast({ type: 'error', message: 'Undo failed' });
                  }
                }}
                className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
              >
                Undo
              </button>
            )}
  {helpOpen && (
    <>
      <div
        className="fixed inset-0 z-[60]"
        onClick={() => setHelpOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="快捷键说明"
        className="fixed bottom-20 right-6 z-[61] w-80 max-w-[90vw] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg"
      >
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
          <div className="text-sm font-medium">Keyboard Shortcuts</div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const text = [
                  'r / u：标记已读 / 未读',
                  'ESC：清空选择',
                  '↑ ↓ / Enter：移动并打开',
                  'Shift+Enter：打开下一条',
                  'Home / End：跳至首 / 尾',
                  'Space / a / c：选择当前 / 全选 / 清空',
                  'o：打开引用',
                  'Ctrl / ⌘ + Enter 或 o：新标签页打开',
                  '/：聚焦搜索',
                  '？：打开/关闭快捷键帮助',
                  '静音类型在列表中隐藏；可用工具栏标签或右键取消静音',
                  'Reset / Clear：会清空静音类型',
                ].join('\\n');
                try {
                  await navigator.clipboard.writeText(text);
                  setHelpCopied(true);
                  setTimeout(() => setHelpCopied(false), 1200);
                } catch {}
              }}
              className="text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              {helpCopied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={() => setHelpOpen(false)}
              className="text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              Close
            </button>
          </div>
        </div>
        <ul className="p-3 text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
          <li>r / u：标记已读 / 未读</li>
          <li>ESC：清空选择</li>
          <li>↑ ↓ / Enter：移动并打开</li>
          <li>Shift+Enter：打开下一条</li>
          <li>Home / End：跳至首 / 尾</li>
          <li>Space / a / c：选择当前 / 全选 / 清空</li>
          <li>o：打开引用</li>
          <li>Ctrl / ⌘ + Enter 或 o：新标签页打开</li>
          <li>/：聚焦搜索</li>
          <li>？：打开/关闭快捷键帮助</li>
          <li>静音类型在列表中隐藏；可用工具栏标签或右键取消静音</li>
          <li>Reset / Clear：会清空静音类型</li>
        </ul>
      </div>
    </>
  )}
            <button
              onClick={() => setToast(null)}
              className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {menu.open && menu.id && (
        <>
          <div
            className="fixed inset-0 z-[70]"
            onClick={() => setMenu({ open: false, x: 0, y: 0, id: null })}
            aria-hidden="true"
          />
          {(() => {
            const n = items.find((x) => x.id === menu.id);
            if (!n) return null;
            const ref = getReferenceLink(n);
            const top = Math.min(menu.y, window.innerHeight - 180);
            const left = Math.min(menu.x, window.innerWidth - 220);
            return (
              <div
                role="menu"
                aria-label="Notification actions"
                className="fixed z-[71] w-52 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg"
                style={{ top, left }}
              >
                <button
                  disabled={!ref}
                  onClick={() => {
                    if (ref) {
                      router.push(ref.href);
                    }
                    setMenu({ open: false, x: 0, y: 0, id: null });
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60 disabled:opacity-50"
                  role="menuitem"
                >
                  Open
                </button>
                <button
                  disabled={!ref}
                  onClick={() => {
                    if (ref) {
                      window.open(ref.href, '_blank');
                    }
                    setMenu({ open: false, x: 0, y: 0, id: null });
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60 disabled:opacity-50"
                  role="menuitem"
                >
                  Open in new tab
                </button>
                <button
                  onClick={() => {
                    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: !n.isRead } : x)));
                    if (n.isRead) markAsUnread.mutate(n.id);
                    else markAsRead.mutate(n.id);
                    setMenu({ open: false, x: 0, y: 0, id: null });
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  role="menuitem"
                >
                  {n.isRead ? 'Mark as unread' : 'Mark as read'}
                </button>
                <button
                  disabled={!ref}
                  onClick={async () => {
                    if (ref) {
                      try {
                        await navigator.clipboard.writeText((typeof window !== 'undefined' ? window.location.origin : '') + ref.href);
                        setToast({ type: 'success', message: 'Link copied' });
                      } catch {
                        setToast({ type: 'error', message: 'Copy failed' });
                      }
                    }
                    setMenu({ open: false, x: 0, y: 0, id: null });
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60 disabled:opacity-50"
                  role="menuitem"
                >
                  Copy link
                </button>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(n.title || '');
                      setToast({ type: 'success', message: 'Title copied' });
                    } catch {
                      setToast({ type: 'error', message: 'Copy failed' });
                    }
                    setMenu({ open: false, x: 0, y: 0, id: null });
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  role="menuitem"
                >
                  Copy title
                </button>
                <button
                  onClick={() => {
                    setSelected(new Set([n.id]));
                    setLastSelectedIndex(items.findIndex((x) => x.id === n.id));
                    setToast({ type: 'success', message: 'Selected 1 item' });
                    setMenu({ open: false, x: 0, y: 0, id: null });
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  role="menuitem"
                >
                  Select only this
                </button>
                <button
                  onClick={() => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(n.id)) next.delete(n.id);
                      else next.add(n.id);
                      return next;
                    });
                    setLastSelectedIndex(items.findIndex((x) => x.id === n.id));
                    setMenu({ open: false, x: 0, y: 0, id: null });
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  role="menuitem"
                >
                  Toggle select
                </button>
                <button
                  onClick={async () => {
                    try {
                      const plain = (n.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                      await navigator.clipboard.writeText(plain);
                      setToast({ type: 'success', message: 'Content copied' });
                    } catch {
                      setToast({ type: 'error', message: 'Copy failed' });
                    }
                    setMenu({ open: false, x: 0, y: 0, id: null });
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  role="menuitem"
                >
                  Copy content
                </button>
                <button
                  onClick={() => {
                    setType(n.type || '');
                    resetAndFetch();
                    updateQuery({ type: n.type || '' });
                    setMenu({ open: false, x: 0, y: 0, id: null });
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  role="menuitem"
                >
                  Filter by this type
                </button>
                <button
                  onClick={() => {
                    const next = new Set(mutedTypes);
                    if (next.has(n.type)) {
                      next.delete(n.type);
                      setToast({ type: 'success', message: `Unmuted ${n.type}` });
                    } else {
                      next.add(n.type);
                      setToast({ type: 'success', message: `Muted ${n.type}` });
                    }
                    setMutedTypes(next);
                    setMenu({ open: false, x: 0, y: 0, id: null });
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  role="menuitem"
                >
                  {mutedTypes.has(n.type) ? 'Unmute this type' : 'Mute this type'}
                </button>
                <button
                  onClick={() => {
                    const idx = items.findIndex((x) => x.id === n.id);
                    if (idx === -1) return;
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (lastSelectedIndex !== null) {
                        const start = Math.min(lastSelectedIndex, idx);
                        const end = Math.max(lastSelectedIndex, idx);
                        for (let i = start; i <= end; i++) next.add(items[i].id);
                      } else {
                        next.add(n.id);
                      }
                      return next;
                    });
                    setLastSelectedIndex(items.findIndex((x) => x.id === n.id));
                    setToast({ type: 'success', message: 'Range selected' });
                    setMenu({ open: false, x: 0, y: 0, id: null });
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  role="menuitem"
                >
                  Select range from here
                </button>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
