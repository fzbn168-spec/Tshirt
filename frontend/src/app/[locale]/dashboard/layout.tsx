'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Settings, 
  LogOut, 
  Users,
  Bell,
  Building2,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/hooks/useNotifications';
import api from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('Dashboard.sidebar');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { unreadCount, markAsRead, markAllAsRead, markAsUnread } = useNotifications();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [refFilter, setRefFilter] = useState<string>('');
  const [types, setTypes] = useState<string[]>([]);
  const [refTypes, setRefTypes] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [collapseRead, setCollapseRead] = useState(false);
  const [tempRevealRead, setTempRevealRead] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [confirmFocus, setConfirmFocus] = useState<'confirm' | 'cancel'>('confirm');
  const [confirmCountdown, setConfirmCountdown] = useState(0);
  const [dropdownActiveIndex, setDropdownActiveIndex] = useState(0);
  const [dropdownHelpOpen, setDropdownHelpOpen] = useState(false);
  const [dropdownHelpCopied, setDropdownHelpCopied] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ open: boolean; x: number; y: number; id: string | null }>({
    open: false,
    x: 0,
    y: 0,
    id: null,
  });
  const [mutedTypes, setMutedTypes] = useState<Set<string>>(() => {
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem('bell:mutedTypes') : null;
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      return new Set(arr);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (!confirmAll) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConfirmAll(false);
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setConfirmFocus((prev) => (prev === 'confirm' ? 'cancel' : 'confirm'));
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter') {
        if (confirmFocus === 'confirm') {
          markAllAsRead.mutate();
          setConfirmAll(false);
        } else {
          setConfirmAll(false);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    setConfirmCountdown(3);
    const interval = setInterval(() => {
      setConfirmCountdown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    const timer = setTimeout(() => setConfirmAll(false), 3000);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [confirmAll, confirmFocus, markAllAsRead]);

  useEffect(() => {
    if (!open) return;
    // 读取持久化筛选
    try {
      const raw = sessionStorage.getItem('bell:filters');
      if (raw) {
        const saved = JSON.parse(raw) as { onlyUnread?: boolean; type?: string; refType?: string; collapseRead?: boolean };
        setOnlyUnread(!!saved.onlyUnread);
        setTypeFilter(saved.type || '');
        setRefFilter(saved.refType || '');
        setCollapseRead(!!saved.collapseRead);
      }
    } catch {
      // ignore
    }
    setItems([]);
    setPage(1);
    setHasMore(true);
    setTotalCount(null);
  }, [open, typeFilter, refFilter]);

  useEffect(() => {
    try {
      sessionStorage.setItem('bell:mutedTypes', JSON.stringify(Array.from(mutedTypes)));
    } catch {}
  }, [mutedTypes]);

  useEffect(() => {
    const fetchPage = async () => {
      if (!open || !hasMore || loading) return;
      setLoading(true);
      try {
        const res = await api.get<Notification[]>('/notifications', {
          params: { 
            page, 
            limit: 8, 
            isRead: onlyUnread ? 'false' : undefined,
            type: typeFilter || undefined,
            referenceType: refFilter || undefined
          },
        });
        const list = res.data || [];
        const headerTotal = res.headers?.['x-total-count'];
        let t: number | null = totalCount;
        if (t === null && headerTotal && !Number.isNaN(Number(headerTotal))) {
          t = Number(headerTotal);
          setTotalCount(t);
        }
        setItems((prev) => {
          const next = [...prev, ...list];
          if (t != null) {
            setHasMore(next.length < t);
          } else {
            if (list.length < 8) setHasMore(false);
          }
          return next;
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [open, page, hasMore, loading, onlyUnread, typeFilter, refFilter, totalCount]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    Promise.all([
      api.get<string[]>('/notifications/types'),
      api.get<string[]>('/notifications/reference-types'),
    ])
      .then(([tRes, rRes]) => {
        if (!mounted) return;
        setTypes(tRes.data || []);
        setRefTypes(rRes.data || []);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // 持久化筛选状态
    const payload = { onlyUnread, type: typeFilter, refType: refFilter, collapseRead };
    sessionStorage.setItem('bell:filters', JSON.stringify(payload));
  }, [open, onlyUnread, typeFilter, refFilter, collapseRead]);

  useEffect(() => {
    if (!open || confirmAll || !dropdownHelpOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownHelpOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, confirmAll, dropdownHelpOpen]);

  useEffect(() => {
    if (!open || confirmAll) return;
    const isVisible = (n: Notification) => !((collapseRead && !tempRevealRead && n.isRead) || mutedTypes.has(n.type));
    const visibleIndices = items.map((n, i) => (isVisible(n) ? i : -1)).filter((i) => i !== -1);
    if (visibleIndices.length > 0) {
      setDropdownActiveIndex(visibleIndices[0]);
    } else {
      setDropdownActiveIndex(0);
    }
  }, [open, confirmAll, items, collapseRead, tempRevealRead, mutedTypes]);

  useEffect(() => {
    if (!open || confirmAll) return;
    const onDropdownKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea' || (target?.isContentEditable ?? false)) return;
      if (ctxMenu.open && e.key === 'Escape') {
        e.preventDefault();
        setCtxMenu({ open: false, x: 0, y: 0, id: null });
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setDropdownHelpOpen((v) => !v);
        return;
      }
      const isVisible = (n: Notification) => !((collapseRead && !tempRevealRead && n.isRead) || mutedTypes.has(n.type));
      const nextVisible = (from: number, dir: 1 | -1) => {
        if (items.length === 0) return -1;
        let i = from;
        for (let steps = 0; steps < items.length; steps++) {
          i = i + dir;
          if (i < 0) i = 0;
          if (i >= items.length) i = items.length - 1;
          if (isVisible(items[i])) return i;
          if ((dir === 1 && i === items.length - 1) || (dir === -1 && i === 0)) break;
        }
        return from;
      };
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        if (items.length === 0) return;
        const start = e.key === 'Home' ? 0 : items.length - 1;
        let idx = start;
        while (idx >= 0 && idx < items.length && !isVisible(items[idx])) {
          idx = e.key === 'Home' ? idx + 1 : idx - 1;
        }
        setDropdownActiveIndex(Math.max(0, Math.min(items.length - 1, idx)));
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (items.length === 0) return;
        e.preventDefault();
        const dir = e.key === 'ArrowDown' ? 1 : -1;
        const next = nextVisible(dropdownActiveIndex, dir);
        setDropdownActiveIndex(next);
        return;
      }
      const n = items[dropdownActiveIndex];
      if (!n) return;
      if (e.key === 'Enter') {
        const ref = getReferenceLink(n);
        if (ref) {
          if (!n.isRead) {
            setItems((prev) => prev.map((x, i) => (i === dropdownActiveIndex ? { ...x, isRead: true } : x)));
            markAsRead.mutate(n.id);
          }
          router.push(ref.href);
        }
        return;
      }
      if (e.key === 'r') {
        if (!n.isRead) return;
        setItems((prev) => prev.map((x, i) => (i === dropdownActiveIndex ? { ...x, isRead: true } : x)));
        markAsRead.mutate(n.id);
        return;
      }
      if (e.key === 'u') {
        if (n.isRead === false) return;
        setItems((prev) => prev.map((x, i) => (i === dropdownActiveIndex ? { ...x, isRead: false } : x)));
        markAsUnread.mutate(n.id);
        return;
      }
    };
    window.addEventListener('keydown', onDropdownKey);
    return () => window.removeEventListener('keydown', onDropdownKey);
  }, [open, confirmAll, items, dropdownActiveIndex, collapseRead, tempRevealRead, markAsRead, markAsUnread, router, ctxMenu.open, mutedTypes]);

  useEffect(() => {
    if (!open || confirmAll) return;
    const current = items[dropdownActiveIndex];
    if (!current) return;
    const el = document.getElementById(`bell-option-${current.id}`);
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [open, confirmAll, items, dropdownActiveIndex]);

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
    if (n.referenceId && n.referenceType === 'PRODUCT') {
      return { href: `/product/${n.referenceId}`, label: 'View Product' };
    }
    if (n.referenceType === 'COMPANY') {
      return { href: `/dashboard/profile`, label: 'View Company' };
    }
    return null;
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated()) {
    return null; // Or a loading spinner
  }

  const navigation = [
    { name: t('overview'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('profile'), href: '/dashboard/profile', icon: Building2 },
    { name: t('inquiries'), href: '/dashboard/inquiries', icon: FileText },
    { name: t('orders'), href: '/dashboard/orders', icon: Package },
    { name: t('subAccounts'), href: '/dashboard/users', icon: Users },
    { name: t('settings'), href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hidden md:flex flex-col fixed inset-y-0">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/" className="text-xl font-bold tracking-tight">
            SOLE<span className="text-blue-600">TRADE</span>
            <span className="text-xs font-normal text-zinc-500 block mt-1">{t('enterpriseConsole')}</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20" 
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
              {user?.fullName?.substring(0, 2) || 'US'}
            </div>
            <div className="text-sm">
              <div className="font-medium">{user?.fullName || 'User'}</div>
              <div className="text-xs text-zinc-500 truncate max-w-[140px]">{user?.company?.name || 'Company'}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors dark:hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-semibold capitalize">
            {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
          </h1>
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800 relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0 -right-0 min-w-[18px] h-[18px] px-1 text-[10px] leading-[18px] text-white bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">Notifications</div>
                    {totalCount !== null && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {items.length}/{totalCount}
                      </span>
                    )}
                    {(onlyUnread || typeFilter || refFilter) && (
                      <div className="flex items-center gap-1">
                        {onlyUnread && (
                          <button
                            aria-label="Remove Unread filter"
                            onClick={() => {
                              setOnlyUnread(false);
                              setItems([]);
                              setPage(1);
                              setHasMore(true);
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 hover:opacity-80"
                            title="Remove Unread filter"
                          >
                            Unread ×
                          </button>
                        )}
                        {typeFilter && (
                          <button
                            aria-label="Remove type filter"
                            onClick={() => {
                              setTypeFilter('');
                              setItems([]);
                              setPage(1);
                              setHasMore(true);
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 hover:opacity-80"
                            title="Remove type filter"
                          >
                            {typeFilter} ×
                          </button>
                        )}
                        {refFilter && (
                          <button
                            aria-label="Remove reference type filter"
                            onClick={() => {
                              setRefFilter('');
                              setItems([]);
                              setPage(1);
                              setHasMore(true);
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 hover:opacity-80"
                            title="Remove reference filter"
                          >
                            {refFilter} ×
                          </button>
                        )}
                        <button
                          aria-label="Clear all filters"
                          onClick={() => {
                            setOnlyUnread(false);
                            setTypeFilter('');
                            setRefFilter('');
                            setItems([]);
                            setPage(1);
                            setHasMore(true);
                          }}
                          className="ml-1 text-[10px] px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          title="Clear filters"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  <select
                    aria-label="Filter by type"
                    className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="">All types</option>
                    {types.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter by reference type"
                    className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    value={refFilter}
                    onChange={(e) => setRefFilter(e.target.value)}
                  >
                    <option value="">All refs</option>
                    {refTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={onlyUnread}
                      onChange={(e) => {
                        setItems([]);
                        setPage(1);
                        setHasMore(true);
                        setOnlyUnread(e.target.checked);
                      }}
                    />
                    Unread only
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={collapseRead}
                      onChange={(e) => setCollapseRead(e.target.checked)}
                    />
                    Collapse read
                  </label>
                  {!confirmAll ? (
                    unreadCount ? (
                      <button
                        disabled={!unreadCount}
                        onClick={() => setConfirmAll(true)}
                        className="text-xs px-2 py-1 rounded-md bg-blue-600 text-white disabled:opacity-50"
                      >
                        Mark all read
                      </button>
                    ) : (
                      <span className="text-[11px] text-zinc-500">All caught up</span>
                    )
                  ) : (
                    <div className="inline-flex items-center gap-2" role="group" aria-label="Confirm marking all as read" aria-live="polite">
                      <span className="text-[11px] text-zinc-500">
                        Mark all read{unreadCount ? ` (${unreadCount})` : ''}?
                      </span>
                      {confirmCountdown > 0 && (
                        <span className="text-[11px] text-zinc-400">Cancel in {confirmCountdown}s</span>
                      )}
                      <span className="text-[11px] text-zinc-400 hidden sm:inline">
                        Enter to confirm • Esc to cancel
                      </span>
                      <button
                        disabled={markAllAsRead.isPending}
                        onClick={() => {
                          markAllAsRead.mutate();
                          setConfirmAll(false);
                        }}
                        className={`text-xs px-2 py-1 rounded-md bg-blue-600 text-white ${confirmFocus === 'confirm' ? 'ring-2 ring-blue-400' : ''}`}
                        aria-current={confirmFocus === 'confirm' ? 'true' : undefined}
                        aria-keyshortcuts="Enter"
                        autoFocus={confirmFocus === 'confirm'}
                      >
                        {markAllAsRead.isPending ? 'Working...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmAll(false)}
                        className={`text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 ${confirmFocus === 'cancel' ? 'ring-2 ring-zinc-400 dark:ring-zinc-600' : ''}`}
                        aria-current={confirmFocus === 'cancel' ? 'true' : undefined}
                        aria-keyshortcuts="Esc Enter"
                        autoFocus={confirmFocus === 'cancel'}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                {collapseRead && items.some((x) => x.isRead) && (
                  <div className="px-4 py-2 text-[11px] text-zinc-500">
                    Collapsed {items.filter((x) => x.isRead).length} read on this page
                  </div>
                )}
                {mutedTypes.size > 0 && (
                  <div className="px-4 py-2 text-[11px] text-zinc-500 flex items-center gap-2 flex-wrap">
                    <span>Muted:</span>
                    {Array.from(mutedTypes).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          const next = new Set(mutedTypes);
                          next.delete(t);
                          setMutedTypes(next);
                        }}
                        className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:opacity-80"
                        title="Unmute this type"
                      >
                        {t} ×
                      </button>
                    ))}
                    <button
                      onClick={() => setMutedTypes(new Set())}
                      className="ml-auto text-[11px] px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                      title="Unmute all types"
                    >
                      Unmute all
                    </button>
                  </div>
                )}
                <ul
                  className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800"
                  aria-busy={loading ? 'true' : 'false'}
                  role="listbox"
                  aria-activedescendant={
                    items[dropdownActiveIndex] ? `bell-option-${items[dropdownActiveIndex].id}` : undefined
                  }
                  aria-label="Notifications list"
                  aria-keyshortcuts="ArrowUp ArrowDown Home End Enter r u Escape ?"
                >
                  {items.map((n, idx) => (
                    <li
                      key={n.id}
                      id={`bell-option-${n.id}`}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all ${
                        (collapseRead && !tempRevealRead && n.isRead) || mutedTypes.has(n.type)
                          ? 'opacity-0 max-h-0 p-0 m-0 overflow-hidden duration-300 pointer-events-none'
                          : 'p-3 duration-200'
                      } ${idx === dropdownActiveIndex ? 'ring-2 ring-blue-300 dark:ring-blue-700 rounded-md' : ''}`}
                      role="option"
                      aria-selected={idx === dropdownActiveIndex}
                      onMouseMove={() => setDropdownActiveIndex(idx)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setDropdownActiveIndex(idx);
                        setCtxMenu({ open: true, x: e.clientX, y: e.clientY, id: n.id });
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {!n.isRead && <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{n.title}</div>
                          <div className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.content}</div>
                          {(() => {
                            const ref = getReferenceLink(n);
                            if (!ref) return null;
                            return (
                              <Link
                                href={ref.href}
                                className="block mt-1 text-xs text-blue-600 hover:underline"
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
                          {n.isRead ? (
                            <button
                              onClick={() => {
                                setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: false } : x)));
                                markAsUnread.mutate(n.id);
                              }}
                              className="mt-2 text-xs text-blue-600 hover:underline"
                            >
                              Mark as unread
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
                                markAsRead.mutate(n.id);
                              }}
                              className="mt-2 text-xs text-blue-600 hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                  {items.length === 0 && loading && (
                    <>
                      {[1, 2, 3].map((i) => (
                        <li key={`sk-${i}`} className="p-3">
                          <div className="animate-pulse">
                            <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-900 rounded mb-1" />
                            <div className="h-2 w-3/4 bg-zinc-100 dark:bg-zinc-900 rounded" />
                          </div>
                        </li>
                      ))}
                    </>
                  )}
                  {((collapseRead ? items.filter((x) => !x.isRead).length === 0 : items.length === 0) && !loading) && (
                    <li className="p-4 text-sm text-zinc-500">No notifications</li>
                  )}
                </ul>
                <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 text-right flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && hasMore && !loading) {
                          setPage((p) => p + 1);
                        }
                      }}
                      className="h-1.5 w-full rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={totalCount ?? 0}
                      aria-valuenow={items.length}
                      aria-label="Notifications load progress"
                      title={totalCount ? `${Math.min(100, Math.round((items.length / totalCount) * 100))}%` : '0%'}
                    >
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{
                          width:
                            totalCount && totalCount > 0
                              ? `${Math.min(100, Math.round((items.length / totalCount) * 100))}%`
                              : '0%',
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {totalCount != null ? `${items.length}/${totalCount}` : ''}
                    </span>
                  </div>
                  {collapseRead && items.some((x) => x.isRead) && (
                    <button
                      onClick={() => setTempRevealRead((v) => !v)}
                      className="text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                      title={tempRevealRead ? 'Hide read temporarily' : 'Show read temporarily'}
                    >
                      {tempRevealRead ? 'Hide read' : 'Show read'}
                    </button>
                  )}
                  {loading ? (
                    <button
                      disabled
                      className="text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 animate-pulse"
                    >
                      Loading...
                    </button>
                  ) : hasMore ? (
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                      title={
                        totalCount != null
                          ? `${Math.max(0, totalCount - items.length)} left`
                          : 'Load more'
                      }
                    >
                      {totalCount != null
                        ? `Load more (${Math.max(0, totalCount - items.length)} left)`
                        : 'Load more'}
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-500">End</span>
                  )}
                  <span className="text-[10px] text-zinc-500 hidden sm:inline">
                    Shortcuts: ↑↓/Enter r/u ESC Home/End
                  </span>
                  <button
                    onClick={() => setDropdownHelpOpen((v) => !v)}
                    aria-label="快捷键说明"
                    title="快捷键：↑↓/Enter 导航并打开；r/u 读未读；ESC 关闭；Home/End 首尾；在折叠已读时仅在可见项间移动"
                    className="text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 inline-flex items-center gap-1"
                    type="button"
                  >
                    <HelpCircle className="h-3 w-3" />
                    Help
                  </button>
                  {dropdownHelpOpen && (
                    <>
                      <div className="fixed inset-0 z-[60]" aria-hidden="true" onClick={() => setDropdownHelpOpen(false)} />
                      <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="快捷键说明"
                        className="fixed bottom-24 right-6 z-[61] w-72 max-w-[90vw] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg"
                      >
                        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <div className="text-sm font-medium">Keyboard Shortcuts</div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                const text = [
                                  '↑ ↓ / Enter：移动并打开',
                                  'r / u：标记已读 / 未读',
                                  'ESC：关闭下拉',
                                  'Home / End：跳至首 / 尾',
                                  '折叠已读时仅在可见项间移动',
                                  '？：打开/关闭快捷键帮助',
                                  '静音类型在列表中隐藏；可在头部标签中取消静音',
                                ].join('\\n');
                                try {
                                  await navigator.clipboard.writeText(text);
                                  setDropdownHelpCopied(true);
                                  setTimeout(() => setDropdownHelpCopied(false), 1200);
                                } catch {}
                              }}
                              className="text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                            >
                              {dropdownHelpCopied ? 'Copied' : 'Copy'}
                            </button>
                            <button
                              onClick={() => setDropdownHelpOpen(false)}
                              className="text-xs px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                        <ul className="p-3 text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
                          <li>↑ ↓ / Enter：移动并打开</li>
                          <li>r / u：标记已读 / 未读</li>
                          <li>ESC：关闭下拉</li>
                          <li>Home / End：跳至首 / 尾</li>
                          <li>折叠已读时仅在可见项间移动</li>
                          <li>？：打开/关闭快捷键帮助</li>
                          <li>静音类型在列表中隐藏；可在头部标签中取消静音</li>
                        </ul>
                      </div>
                    </>
                  )}
                  <Link href="/dashboard/notifications" className="text-xs text-blue-600 hover:underline">
                    View all
                  </Link>
                </div>
              </div>
            )}
          </div>
          {ctxMenu.open && ctxMenu.id && (
            <>
              <div className="fixed inset-0 z-[80]" aria-hidden="true" onClick={() => setCtxMenu({ open: false, x: 0, y: 0, id: null })} />
              {(() => {
                const n = items.find((x) => x.id === ctxMenu.id);
                if (!n) return null;
                const ref = getReferenceLink(n);
                const top = Math.min(ctxMenu.y, window.innerHeight - 160);
                const left = Math.min(ctxMenu.x, window.innerWidth - 220);
                return (
                  <div
                    role="menu"
                    aria-label="Notification actions"
                    className="fixed z-[81] w-52 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg"
                    style={{ top, left }}
                  >
                    <button
                      disabled={!ref}
                      onClick={() => {
                        if (ref) {
                          if (!n.isRead) {
                            setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
                            markAsRead.mutate(n.id);
                          }
                          router.push(ref.href);
                        }
                        setCtxMenu({ open: false, x: 0, y: 0, id: null });
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
                          if (!n.isRead) {
                            setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
                            markAsRead.mutate(n.id);
                          }
                          window.open(ref.href, '_blank');
                        }
                        setCtxMenu({ open: false, x: 0, y: 0, id: null });
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
                        setCtxMenu({ open: false, x: 0, y: 0, id: null });
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
                          } catch {}
                        }
                        setCtxMenu({ open: false, x: 0, y: 0, id: null });
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60 disabled:opacity-50"
                      role="menuitem"
                    >
                      Copy link
                    </button>
                    <button
                      onClick={() => {
                        setTypeFilter(n.type || '');
                        setItems([]);
                        setPage(1);
                        setHasMore(true);
                        setTotalCount(null);
                        setCtxMenu({ open: false, x: 0, y: 0, id: null });
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                      role="menuitem"
                    >
                      Filter by this type
                    </button>
                    <button
                      onClick={() => {
                        const next = new Set(mutedTypes);
                        if (next.has(n.type)) next.delete(n.type);
                        else next.add(n.type);
                        setMutedTypes(next);
                        setCtxMenu({ open: false, x: 0, y: 0, id: null });
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                      role="menuitem"
                    >
                      {mutedTypes.has(n.type) ? 'Unmute this type' : 'Mute this type'}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const plain = (n.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                          if (plain) {
                            await navigator.clipboard.writeText(plain);
                          }
                        } catch {}
                        setCtxMenu({ open: false, x: 0, y: 0, id: null });
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                      role="menuitem"
                    >
                      Copy content
                    </button>
                  </div>
                );
              })()}
            </>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
