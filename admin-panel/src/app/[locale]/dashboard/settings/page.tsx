'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Loader2, Save, Plus } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';

interface SystemSetting {
  key: string;
  value: string;
  description?: string;
}

interface ExchangeRate {
  currency: string;
  rate: number;
}

interface NavItemConfig {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  sortOrder: number;
}

interface CategoryCardConfig {
  id: string;
  label: string;
  imageUrl: string;
  href: string;
  enabled: boolean;
  sortOrder: number;
}

interface HeroBannerConfig {
  id: string;
  imageUrl: string;
  href: string;
  enabled: boolean;
  sortOrder: number;
}

interface RankingSectionConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
}

interface BrandLogoConfig {
  id: string;
  name: string;
  imageUrl: string;
  href: string;
  enabled: boolean;
  sortOrder: number;
}

interface BrandWallConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  logos: BrandLogoConfig[];
}

interface TextBlockConfig {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  sortOrder: number;
}

type SectionType =
  | 'hero'
  | 'ranking'
  | 'categoryGrid'
  | 'brandWall'
  | 'textBlock'
  | 'collectionProducts';

type CollectionSourceType = 'category' | 'keyword' | 'tag' | 'manual' | 'raw';

interface CollectionSourceConfig {
  type: CollectionSourceType;
  categoryId?: string;
  keyword?: string;
  tag?: string;
  productIds?: string;
  rawPath?: string;
  sort?: string;
}

interface HomeSectionConfig {
  id: string;
  type: SectionType;
  title?: string;
  enabled: boolean;
  sortOrder: number;
  textBlockId?: string;
  collectionPath?: string;
  collectionLimit?: number;
  collectionSource?: CollectionSourceConfig;
}

interface LayoutConfig {
  navItems: NavItemConfig[];
  heroBanners: HeroBannerConfig[];
  homeCategoryCards: CategoryCardConfig[];
  rankingSection: RankingSectionConfig;
  brandWall: BrandWallConfig;
  textBlocks: TextBlockConfig[];
  sections: HomeSectionConfig[];
}

function getDefaultLayoutConfig(): LayoutConfig {
  return {
    navItems: [
      {
        id: 'men',
        label: "Men's Shoes",
        href: '/products?search=Men',
        enabled: true,
        sortOrder: 1,
      },
      {
        id: 'women',
        label: "Women's Shoes",
        href: '/products?search=Women',
        enabled: true,
        sortOrder: 2,
      },
      {
        id: 'kids',
        label: "Kids",
        href: '/products?search=Kids',
        enabled: true,
        sortOrder: 3,
      },
      {
        id: 'apparel',
        label: 'Apparel',
        href: '/products?search=Apparel',
        enabled: true,
        sortOrder: 4,
      },
      {
        id: 'new',
        label: 'New Arrivals',
        href: '/products?sort=newest',
        enabled: true,
        sortOrder: 5,
      },
    ],
    heroBanners: [
      {
        id: 'default-hero',
        imageUrl:
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop',
        href: '/products',
        enabled: true,
        sortOrder: 1,
      },
    ],
    homeCategoryCards: [
      {
        id: 'cat-men-sneakers',
        label: "Men's Sneakers",
        imageUrl:
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80',
        href: '/products?search=Men',
        enabled: true,
        sortOrder: 1,
      },
      {
        id: 'cat-hiking',
        label: 'Hiking Boots',
        imageUrl:
          'https://images.unsplash.com/photo-1520639888713-78db11c5dd59?auto=format&fit=crop&w=500&q=80',
        href: '/products?search=Hiking',
        enabled: true,
        sortOrder: 2,
      },
      {
        id: 'cat-women-heels',
        label: "Women's Heels",
        imageUrl:
          'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=500&q=80',
        href: '/products?search=Heels',
        enabled: true,
        sortOrder: 3,
      },
      {
        id: 'cat-kids-active',
        label: "Kids' Active",
        imageUrl:
          'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=500&q=80',
        href: '/products?search=Kids',
        enabled: true,
        sortOrder: 4,
      },
    ],
    rankingSection: {
      enabled: true,
      title: '热销 TOP 10 · 新品推荐',
      subtitle: '帮助买家快速发现热卖款和最新上架款，提升转化。',
    },
    brandWall: {
      enabled: true,
      title: '合作品牌',
      subtitle: '展示重点合作工厂与品牌买家，增强背书。',
      logos: [],
    },
    textBlocks: [],
    sections: [
      {
        id: 'sec-hero',
        type: 'hero',
        title: 'Hero',
        enabled: true,
        sortOrder: 1,
      },
      {
        id: 'sec-ranking',
        type: 'ranking',
        title: 'Ranking',
        enabled: true,
        sortOrder: 2,
      },
      {
        id: 'sec-category',
        type: 'categoryGrid',
        title: 'Categories',
        enabled: true,
        sortOrder: 3,
      },
      {
        id: 'sec-brand-wall',
        type: 'brandWall',
        title: 'Brand Wall',
        enabled: false,
        sortOrder: 4,
      },
    ],
  };
}

export default function SettingsPage() {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [localRates, setLocalRates] = useState<ExchangeRate[]>([]);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await api.get<SystemSetting[]>('/system-settings');
      return res.data;
    },
  });

  const { data: exchangeRates, isLoading: isRatesLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      const res = await api.get<ExchangeRate[]>('/exchange-rates');
      return res.data;
    },
  });

  if (settings && Object.keys(formData).length === 0 && !isLoading) {
    const initialData: Record<string, string> = {};
    settings.forEach((s) => {
      initialData[s.key] = s.value;
    });
    setFormData(initialData);
  }

  if (settings && !layoutConfig && !isLoading) {
    const existing = settings.find((s) => s.key === 'layout_config');
    if (existing && existing.value) {
      try {
        const parsed = JSON.parse(existing.value) as Partial<LayoutConfig>;
        const defaults = getDefaultLayoutConfig();
        const sections =
          parsed.sections && parsed.sections.length > 0
            ? parsed.sections.map((section) => {
                if (
                  section.type === 'collectionProducts' &&
                  !section.collectionSource
                ) {
                  const legacyPath =
                    (section as any).collectionPath || '/products';
                  return {
                    ...section,
                    collectionSource: {
                      type: 'raw',
                      rawPath: legacyPath,
                    } as CollectionSourceConfig,
                  };
                }
                return section;
              })
            : defaults.sections;

        setLayoutConfig({
          navItems:
            parsed.navItems && parsed.navItems.length > 0
              ? parsed.navItems
              : defaults.navItems,
          heroBanners:
            parsed.heroBanners && parsed.heroBanners.length > 0
              ? parsed.heroBanners
              : defaults.heroBanners,
          homeCategoryCards:
            parsed.homeCategoryCards && parsed.homeCategoryCards.length > 0
              ? parsed.homeCategoryCards
              : defaults.homeCategoryCards,
          rankingSection: parsed.rankingSection || defaults.rankingSection,
          brandWall: parsed.brandWall || defaults.brandWall,
          textBlocks: parsed.textBlocks || defaults.textBlocks,
          sections,
        });
      } catch {
        setLayoutConfig(getDefaultLayoutConfig());
      }
    } else {
      setLayoutConfig(getDefaultLayoutConfig());
    }
  }

  if (exchangeRates && localRates.length === 0 && !isRatesLoading) {
    setLocalRates(
      exchangeRates.map((r) => ({
        currency: r.currency,
        rate: r.rate,
      })),
    );
  }

  const mutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const payload = Object.entries(data).map(([key, value]) => ({
        key,
        value,
        description: settings?.find(s => s.key === key)?.description
      }));
      return api.put('/system-settings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      addToast('Settings updated successfully', 'success');
    },
    onError: () => {
      addToast('Failed to update settings', 'error');
    }
  });

  const rateMutation = useMutation({
    mutationFn: async (rate: ExchangeRate) => {
      return api.put('/exchange-rates', rate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      addToast('Exchange rate saved', 'success');
    },
    onError: () => {
      addToast('Failed to save exchange rate', 'error');
    },
  });

  const layoutMutation = useMutation({
    mutationFn: async (config: LayoutConfig) => {
      const payload = [
        {
          key: 'layout_config',
          value: JSON.stringify(config),
          description: 'Homepage and navigation layout configuration',
        },
      ];
      return api.put('/system-settings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      addToast('Layout configuration saved', 'success');
    },
    onError: () => {
      addToast('Failed to save layout configuration', 'error');
    },
  });

  const handleSave = () => {
    mutation.mutate(formData);
  };

  if (isLoading || isRatesLoading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-zinc-500">Configure global units and defaults.</p>
        </div>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
          <h2 className="font-semibold text-lg border-b pb-2">Measurement Units</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Weight Unit</label>
              <p className="text-xs text-zinc-500 mb-2">
                Used for product weight (e.g. kg, lbs)
              </p>
              <Input
                value={formData['weight_unit'] || ''}
                onChange={(e) => setFormData({ ...formData, weight_unit: e.target.value })}
                placeholder="kg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Dimension Unit</label>
              <p className="text-xs text-zinc-500 mb-2">
                Used for product dimensions (e.g. cm, in)
              </p>
              <Input
                value={formData['dimension_unit'] || ''}
                onChange={(e) => setFormData({ ...formData, dimension_unit: e.target.value })}
                placeholder="cm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Currency Code</label>
              <p className="text-xs text-zinc-500 mb-2">
                Default currency for prices (e.g. USD, CNY)
              </p>
              <Input
                value={formData['currency'] || ''}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="USD"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">Exchange Rates</h2>
              <p className="text-xs text-zinc-500">
                Maintain currency conversion rates used by the storefront.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setLocalRates((prev) => [...prev, { currency: '', rate: 1 }])
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Currency
            </Button>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                    Currency
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                    Rate (vs USD)
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {localRates.map((rate, index) => (
                  <tr
                    key={`${rate.currency || 'new'}-${index}`}
                    className="border-t border-zinc-200 dark:border-zinc-800"
                  >
                    <td className="px-4 py-2">
                      <Input
                        value={rate.currency}
                        onChange={(e) => {
                          const next = [...localRates];
                          next[index] = { ...next[index], currency: e.target.value.toUpperCase() };
                          setLocalRates(next);
                        }}
                        placeholder="e.g. USD"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={rate.rate}
                        onChange={(e) => {
                          const next = [...localRates];
                          next[index] = {
                            ...next[index],
                            rate: Number(e.target.value || 0),
                          };
                          setLocalRates(next);
                        }}
                        placeholder="1"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!rate.currency || rateMutation.isPending}
                        onClick={() => rateMutation.mutate(rate)}
                      >
                        {rateMutation.isPending && (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        )}
                        Save
                      </Button>
                    </td>
                  </tr>
                ))}
                {localRates.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-xs text-zinc-500"
                    >
                      No exchange rates configured yet. Use &quot;Add Currency&quot; to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {layoutConfig && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">Homepage & Navigation Layout</h2>
                <p className="text-xs text-zinc-500">
                  Configure navigation menu, hero banner, and homepage category cards.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={layoutMutation.isPending}
                onClick={() => layoutMutation.mutate(layoutConfig)}
              >
                {layoutMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                )}
                Save Layout
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Navigation Menu</h3>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                          Label
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                          Link
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                          Sort
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-zinc-500">
                          Enabled
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {layoutConfig.navItems.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-t border-zinc-200 dark:border-zinc-800"
                        >
                          <td className="px-3 py-2">
                            <Input
                              value={item.label}
                              onChange={(e) => {
                                const next = [...layoutConfig.navItems];
                                next[index] = { ...next[index], label: e.target.value };
                                setLayoutConfig({
                                  ...layoutConfig,
                                  navItems: next,
                                });
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={item.href}
                              onChange={(e) => {
                                const next = [...layoutConfig.navItems];
                                next[index] = { ...next[index], href: e.target.value };
                                setLayoutConfig({
                                  ...layoutConfig,
                                  navItems: next,
                                });
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              inputMode="numeric"
                              value={item.sortOrder}
                              onChange={(e) => {
                                const value = Number(e.target.value || 0);
                                const next = [...layoutConfig.navItems];
                                next[index] = { ...next[index], sortOrder: value };
                                setLayoutConfig({
                                  ...layoutConfig,
                                  navItems: next,
                                });
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={(e) => {
                                const next = [...layoutConfig.navItems];
                                next[index] = { ...next[index], enabled: e.target.checked };
                                setLayoutConfig({
                                  ...layoutConfig,
                                  navItems: next,
                                });
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setLayoutConfig({
                        ...layoutConfig,
                        navItems: [
                          ...layoutConfig.navItems,
                          {
                            id: `nav-${Date.now()}`,
                            label: '',
                            href: '/products',
                            enabled: true,
                            sortOrder: layoutConfig.navItems.length + 1,
                          },
                        ],
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Nav Item
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Hero Banner</h3>
                  {(() => {
                    const hero =
                      layoutConfig.heroBanners[0] ||
                      getDefaultLayoutConfig().heroBanners[0];
                    return (
                      <div className="space-y-3">
                        <label className="block text-xs text-zinc-500">
                          Image URL
                        </label>
                        <Input
                          value={hero.imageUrl}
                          onChange={(e) => {
                            const nextHero = {
                              ...hero,
                              imageUrl: e.target.value,
                            };
                            const rest = layoutConfig.heroBanners.slice(1);
                            setLayoutConfig({
                              ...layoutConfig,
                              heroBanners: [nextHero, ...rest],
                            });
                          }}
                          placeholder="https://..."
                        />
                        <label className="block text-xs text-zinc-500">
                          Link URL
                        </label>
                        <Input
                          value={hero.href}
                          onChange={(e) => {
                            const nextHero = {
                              ...hero,
                              href: e.target.value,
                            };
                            const rest = layoutConfig.heroBanners.slice(1);
                            setLayoutConfig({
                              ...layoutConfig,
                              heroBanners: [nextHero, ...rest],
                            });
                          }}
                          placeholder="/products"
                        />
                        <label className="inline-flex items-center gap-2 text-xs text-zinc-600 mt-2">
                          <input
                            type="checkbox"
                            checked={hero.enabled}
                            onChange={(e) => {
                              const nextHero = {
                                ...hero,
                                enabled: e.target.checked,
                              };
                              const rest = layoutConfig.heroBanners.slice(1);
                              setLayoutConfig({
                                ...layoutConfig,
                                heroBanners: [nextHero, ...rest],
                              });
                            }}
                          />
                          <span>Enable hero banner</span>
                        </label>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Ranking Section</h3>
                  <label className="inline-flex items-center gap-2 text-xs text-zinc-600">
                    <input
                      type="checkbox"
                      checked={layoutConfig.rankingSection.enabled}
                      onChange={(e) =>
                        setLayoutConfig({
                          ...layoutConfig,
                          rankingSection: {
                            ...layoutConfig.rankingSection,
                            enabled: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Show ranking section on homepage</span>
                  </label>
                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-500">Title</label>
                    <Input
                      value={layoutConfig.rankingSection.title}
                      onChange={(e) =>
                        setLayoutConfig({
                          ...layoutConfig,
                          rankingSection: {
                            ...layoutConfig.rankingSection,
                            title: e.target.value,
                          },
                        })
                      }
                    />
                    <label className="block text-xs text-zinc-500">
                      Subtitle
                    </label>
                    <Input
                      value={layoutConfig.rankingSection.subtitle}
                      onChange={(e) =>
                        setLayoutConfig({
                          ...layoutConfig,
                          rankingSection: {
                            ...layoutConfig.rankingSection,
                            subtitle: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Brand Wall</h3>
                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-500">Title</label>
                    <Input
                      value={layoutConfig.brandWall.title}
                      onChange={(e) =>
                        setLayoutConfig({
                          ...layoutConfig,
                          brandWall: {
                            ...layoutConfig.brandWall,
                            title: e.target.value,
                          },
                        })
                      }
                    />
                    <label className="block text-xs text-zinc-500">Subtitle</label>
                    <Input
                      value={layoutConfig.brandWall.subtitle}
                      onChange={(e) =>
                        setLayoutConfig({
                          ...layoutConfig,
                          brandWall: {
                            ...layoutConfig.brandWall,
                            subtitle: e.target.value,
                          },
                        })
                      }
                    />
                    <label className="inline-flex items-center gap-2 text-xs text-zinc-600 mt-2">
                      <input
                        type="checkbox"
                        checked={layoutConfig.brandWall.enabled}
                        onChange={(e) =>
                          setLayoutConfig({
                            ...layoutConfig,
                            brandWall: {
                              ...layoutConfig.brandWall,
                              enabled: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>Show brand wall on homepage</span>
                    </label>
                  </div>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden mt-3">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-50 dark:bg-zinc-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                            Logo URL
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                            Link
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                            Sort
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-zinc-500">
                            Enabled
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {layoutConfig.brandWall.logos.map((logo, index) => (
                          <tr
                            key={logo.id}
                            className="border-t border-zinc-200 dark:border-zinc-800"
                          >
                            <td className="px-3 py-2">
                              <Input
                                value={logo.name}
                                onChange={(e) => {
                                  const next = [...layoutConfig.brandWall.logos];
                                  next[index] = { ...next[index], name: e.target.value };
                                  setLayoutConfig({
                                    ...layoutConfig,
                                    brandWall: {
                                      ...layoutConfig.brandWall,
                                      logos: next,
                                    },
                                  });
                                }}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={logo.imageUrl}
                                onChange={(e) => {
                                  const next = [...layoutConfig.brandWall.logos];
                                  next[index] = { ...next[index], imageUrl: e.target.value };
                                  setLayoutConfig({
                                    ...layoutConfig,
                                    brandWall: {
                                      ...layoutConfig.brandWall,
                                      logos: next,
                                    },
                                  });
                                }}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={logo.href}
                                onChange={(e) => {
                                  const next = [...layoutConfig.brandWall.logos];
                                  next[index] = { ...next[index], href: e.target.value };
                                  setLayoutConfig({
                                    ...layoutConfig,
                                    brandWall: {
                                      ...layoutConfig.brandWall,
                                      logos: next,
                                    },
                                  });
                                }}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                inputMode="numeric"
                                value={logo.sortOrder}
                                onChange={(e) => {
                                  const value = Number(e.target.value || 0);
                                  const next = [...layoutConfig.brandWall.logos];
                                  next[index] = { ...next[index], sortOrder: value };
                                  setLayoutConfig({
                                    ...layoutConfig,
                                    brandWall: {
                                      ...layoutConfig.brandWall,
                                      logos: next,
                                    },
                                  });
                                }}
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={logo.enabled}
                                onChange={(e) => {
                                  const next = [...layoutConfig.brandWall.logos];
                                  next[index] = { ...next[index], enabled: e.target.checked };
                                  setLayoutConfig({
                                    ...layoutConfig,
                                    brandWall: {
                                      ...layoutConfig.brandWall,
                                      logos: next,
                                    },
                                  });
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLayoutConfig({
                          ...layoutConfig,
                          brandWall: {
                            ...layoutConfig.brandWall,
                            logos: [
                              ...layoutConfig.brandWall.logos,
                              {
                                id: `brand-${Date.now()}`,
                                name: '',
                                imageUrl: '',
                                href: '/',
                                enabled: true,
                                sortOrder: layoutConfig.brandWall.logos.length + 1,
                              },
                            ],
                          },
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Brand Logo
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Text Blocks</h3>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
                    <table className="w-full text-sm align-top">
                      <thead className="bg-zinc-50 dark:bg-zinc-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                            Title
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                            Content
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                            Sort
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-zinc-500">
                            Enabled
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {layoutConfig.textBlocks.map((block, index) => (
                          <tr
                            key={block.id}
                            className="border-t border-zinc-200 dark:border-zinc-800 align-top"
                          >
                            <td className="px-3 py-2 w-40">
                              <Input
                                value={block.title}
                                onChange={(e) => {
                                  const next = [...layoutConfig.textBlocks];
                                  next[index] = { ...next[index], title: e.target.value };
                                  setLayoutConfig({
                                    ...layoutConfig,
                                    textBlocks: next,
                                  });
                                }}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <textarea
                                value={block.content}
                                onChange={(e) => {
                                  const next = [...layoutConfig.textBlocks];
                                  next[index] = { ...next[index], content: e.target.value };
                                  setLayoutConfig({
                                    ...layoutConfig,
                                    textBlocks: next,
                                  });
                                }}
                                className="w-full min-h-[80px] rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm px-2 py-1"
                              />
                            </td>
                            <td className="px-3 py-2 w-24">
                              <Input
                                type="number"
                                inputMode="numeric"
                                value={block.sortOrder}
                                onChange={(e) => {
                                  const value = Number(e.target.value || 0);
                                  const next = [...layoutConfig.textBlocks];
                                  next[index] = { ...next[index], sortOrder: value };
                                  setLayoutConfig({
                                    ...layoutConfig,
                                    textBlocks: next,
                                  });
                                }}
                              />
                            </td>
                            <td className="px-3 py-2 text-center w-20">
                              <input
                                type="checkbox"
                                checked={block.enabled}
                                onChange={(e) => {
                                  const next = [...layoutConfig.textBlocks];
                                  next[index] = { ...next[index], enabled: e.target.checked };
                                  setLayoutConfig({
                                    ...layoutConfig,
                                    textBlocks: next,
                                  });
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLayoutConfig({
                          ...layoutConfig,
                          textBlocks: [
                            ...layoutConfig.textBlocks,
                            {
                              id: `text-${Date.now()}`,
                              title: '',
                              content: '',
                              enabled: true,
                              sortOrder: layoutConfig.textBlocks.length + 1,
                            },
                          ],
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Text Block
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Homepage Category Cards
                </h3>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                          Label
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                          Image URL
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                          Link
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                          Sort
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-zinc-500">
                          Enabled
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {layoutConfig.homeCategoryCards.map((card, index) => (
                        <tr
                          key={card.id}
                          className="border-t border-zinc-200 dark:border-zinc-800"
                        >
                          <td className="px-3 py-2">
                            <Input
                              value={card.label}
                              onChange={(e) => {
                                const next = [...layoutConfig.homeCategoryCards];
                                next[index] = {
                                  ...next[index],
                                  label: e.target.value,
                                };
                                setLayoutConfig({
                                  ...layoutConfig,
                                  homeCategoryCards: next,
                                });
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={card.imageUrl}
                              onChange={(e) => {
                                const next = [...layoutConfig.homeCategoryCards];
                                next[index] = {
                                  ...next[index],
                                  imageUrl: e.target.value,
                                };
                                setLayoutConfig({
                                  ...layoutConfig,
                                  homeCategoryCards: next,
                                });
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={card.href}
                              onChange={(e) => {
                                const next = [...layoutConfig.homeCategoryCards];
                                next[index] = {
                                  ...next[index],
                                  href: e.target.value,
                                };
                                setLayoutConfig({
                                  ...layoutConfig,
                                  homeCategoryCards: next,
                                });
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              inputMode="numeric"
                              value={card.sortOrder}
                              onChange={(e) => {
                                const value = Number(e.target.value || 0);
                                const next = [...layoutConfig.homeCategoryCards];
                                next[index] = {
                                  ...next[index],
                                  sortOrder: value,
                                };
                                setLayoutConfig({
                                  ...layoutConfig,
                                  homeCategoryCards: next,
                                });
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={card.enabled}
                              onChange={(e) => {
                                const next = [...layoutConfig.homeCategoryCards];
                                next[index] = {
                                  ...next[index],
                                  enabled: e.target.checked,
                                };
                                setLayoutConfig({
                                  ...layoutConfig,
                                  homeCategoryCards: next,
                                });
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setLayoutConfig({
                        ...layoutConfig,
                        homeCategoryCards: [
                          ...layoutConfig.homeCategoryCards,
                          {
                            id: `cat-${Date.now()}`,
                            label: '',
                            imageUrl: '',
                            href: '/products',
                            enabled: true,
                            sortOrder: layoutConfig.homeCategoryCards.length + 1,
                          },
                        ],
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category Card
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold">Homepage Sections Order</h3>
                    <p className="text-xs text-zinc-500">
                      Control homepage floors order. Use collection type for topic sections.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setLayoutConfig({
                        ...layoutConfig,
                        sections: [
                          ...layoutConfig.sections,
                          {
                            id: `sec-collection-${Date.now()}`,
                            type: 'collectionProducts',
                            title: 'Collection',
                            enabled: true,
                            sortOrder: layoutConfig.sections.length + 1,
                            collectionLimit: 8,
                            collectionSource: {
                              type: 'category',
                            },
                          },
                        ],
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Collection Section
                  </Button>
                </div>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                          Section
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                          Type
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                          Source Type
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                          Data Source
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                          Max Items
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                          Sort
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-zinc-500">
                          Enabled
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {layoutConfig.sections
                        .slice()
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((section) => {
                          const source: CollectionSourceConfig | undefined =
                            section.type === 'collectionProducts'
                              ? section.collectionSource || {
                                  type: 'raw',
                                  rawPath: section.collectionPath || '/products',
                                }
                              : undefined;

                          return (
                            <tr
                              key={section.id}
                              className="border-t border-zinc-200 dark:border-zinc-800 align-top"
                            >
                              <td className="px-3 py-2">
                                <Input
                                  value={section.title || ''}
                                  onChange={(e) => {
                                    const next = [...layoutConfig.sections];
                                    const idx = next.findIndex(
                                      (s) => s.id === section.id,
                                    );
                                    if (idx === -1) return;
                                    next[idx] = { ...next[idx], title: e.target.value };
                                    setLayoutConfig({
                                      ...layoutConfig,
                                      sections: next,
                                    });
                                  }}
                                />
                              </td>
                              <td className="px-3 py-2 text-xs text-zinc-500">
                                {section.type}
                              </td>
                              <td className="px-3 py-2 w-40">
                                {section.type === 'collectionProducts' ? (
                                  <select
                                    className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs px-2 py-1"
                                    value={source?.type || 'category'}
                                    onChange={(e) => {
                                      const next = [...layoutConfig.sections];
                                      const idx = next.findIndex(
                                        (s) => s.id === section.id,
                                      );
                                      if (idx === -1) return;
                                      const nextSection = {
                                        ...next[idx],
                                        collectionSource: {
                                          ...(next[idx].collectionSource || {}),
                                          type: e.target.value as CollectionSourceType,
                                        },
                                      };
                                      next[idx] = nextSection;
                                      setLayoutConfig({
                                        ...layoutConfig,
                                        sections: next,
                                      });
                                    }}
                                  >
                                    <option value="category">Category</option>
                                    <option value="keyword">Keyword</option>
                                    <option value="tag">Tag</option>
                                    <option value="manual">Manual IDs</option>
                                    <option value="raw">Raw URL</option>
                                  </select>
                                ) : (
                                  <span className="text-xs text-zinc-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {section.type === 'collectionProducts' ? (
                                  <>
                                    {source?.type === 'category' && (
                                      <Input
                                        placeholder="Category ID"
                                        value={source.categoryId || ''}
                                        onChange={(e) => {
                                          const next = [...layoutConfig.sections];
                                          const idx = next.findIndex(
                                            (s) => s.id === section.id,
                                          );
                                          if (idx === -1) return;
                                          const prev = next[idx];
                                          const nextSource: CollectionSourceConfig = {
                                            ...(prev.collectionSource || {
                                              type: 'category',
                                            }),
                                            categoryId: e.target.value,
                                          };
                                          next[idx] = {
                                            ...prev,
                                            collectionSource: nextSource,
                                          };
                                          setLayoutConfig({
                                            ...layoutConfig,
                                            sections: next,
                                          });
                                        }}
                                      />
                                    )}
                                    {source?.type === 'keyword' && (
                                      <Input
                                        placeholder="Keyword, e.g. Boots"
                                        value={source.keyword || ''}
                                        onChange={(e) => {
                                          const next = [...layoutConfig.sections];
                                          const idx = next.findIndex(
                                            (s) => s.id === section.id,
                                          );
                                          if (idx === -1) return;
                                          const prev = next[idx];
                                          const nextSource: CollectionSourceConfig = {
                                            ...(prev.collectionSource || {
                                              type: 'keyword',
                                            }),
                                            keyword: e.target.value,
                                          };
                                          next[idx] = {
                                            ...prev,
                                            collectionSource: nextSource,
                                          };
                                          setLayoutConfig({
                                            ...layoutConfig,
                                            sections: next,
                                          });
                                        }}
                                      />
                                    )}
                                    {source?.type === 'tag' && (
                                      <Input
                                        placeholder="Tag keyword"
                                        value={source.tag || ''}
                                        onChange={(e) => {
                                          const next = [...layoutConfig.sections];
                                          const idx = next.findIndex(
                                            (s) => s.id === section.id,
                                          );
                                          if (idx === -1) return;
                                          const prev = next[idx];
                                          const nextSource: CollectionSourceConfig = {
                                            ...(prev.collectionSource || {
                                              type: 'tag',
                                            }),
                                            tag: e.target.value,
                                          };
                                          next[idx] = {
                                            ...prev,
                                            collectionSource: nextSource,
                                          };
                                          setLayoutConfig({
                                            ...layoutConfig,
                                            sections: next,
                                          });
                                        }}
                                      />
                                    )}
                                    {source?.type === 'manual' && (
                                      <Input
                                        placeholder="Product IDs, comma separated"
                                        value={source.productIds || ''}
                                        onChange={(e) => {
                                          const next = [...layoutConfig.sections];
                                          const idx = next.findIndex(
                                            (s) => s.id === section.id,
                                          );
                                          if (idx === -1) return;
                                          const prev = next[idx];
                                          const nextSource: CollectionSourceConfig = {
                                            ...(prev.collectionSource || {
                                              type: 'manual',
                                            }),
                                            productIds: e.target.value,
                                          };
                                          next[idx] = {
                                            ...prev,
                                            collectionSource: nextSource,
                                          };
                                          setLayoutConfig({
                                            ...layoutConfig,
                                            sections: next,
                                          });
                                        }}
                                      />
                                    )}
                                    {source?.type === 'raw' && (
                                      <Input
                                        placeholder="/products?search=Boots"
                                        value={source.rawPath || section.collectionPath || ''}
                                        onChange={(e) => {
                                          const next = [...layoutConfig.sections];
                                          const idx = next.findIndex(
                                            (s) => s.id === section.id,
                                          );
                                          if (idx === -1) return;
                                          const prev = next[idx];
                                          const nextSource: CollectionSourceConfig = {
                                            ...(prev.collectionSource || {
                                              type: 'raw',
                                            }),
                                            rawPath: e.target.value,
                                          };
                                          next[idx] = {
                                            ...prev,
                                            collectionSource: nextSource,
                                            collectionPath: e.target.value,
                                          };
                                          setLayoutConfig({
                                            ...layoutConfig,
                                            sections: next,
                                          });
                                        }}
                                      />
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-zinc-400">N/A</span>
                                )}
                              </td>
                              <td className="px-3 py-2 w-24">
                                {section.type === 'collectionProducts' ? (
                                  <Input
                                    type="number"
                                    inputMode="numeric"
                                    value={section.collectionLimit ?? 8}
                                    onChange={(e) => {
                                      const value = Number(e.target.value || 0);
                                      const next = [...layoutConfig.sections];
                                      const idx = next.findIndex(
                                        (s) => s.id === section.id,
                                      );
                                      if (idx === -1) return;
                                      next[idx] = {
                                        ...next[idx],
                                        collectionLimit: value,
                                      };
                                      setLayoutConfig({
                                        ...layoutConfig,
                                        sections: next,
                                      });
                                    }}
                                  />
                                ) : (
                                  <span className="text-xs text-zinc-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2 w-32">
                                {section.type === 'collectionProducts' ? (
                                  <select
                                    className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs px-2 py-1"
                                    value={source?.sort || ''}
                                    onChange={(e) => {
                                      const next = [...layoutConfig.sections];
                                      const idx = next.findIndex(
                                        (s) => s.id === section.id,
                                      );
                                      if (idx === -1) return;
                                      const prev = next[idx];
                                      const nextSource: CollectionSourceConfig = {
                                        ...(prev.collectionSource || {
                                          type: source?.type || 'category',
                                        }),
                                        sort: e.target.value || undefined,
                                      };
                                      next[idx] = {
                                        ...prev,
                                        collectionSource: nextSource,
                                      };
                                      setLayoutConfig({
                                        ...layoutConfig,
                                        sections: next,
                                      });
                                    }}
                                  >
                                    <option value="">Default</option>
                                    <option value="newest">Newest</option>
                                    <option value="hot">Best sellers</option>
                                    <option value="priceAsc">Price low to high</option>
                                    <option value="priceDesc">Price high to low</option>
                                  </select>
                                ) : (
                                  <span className="text-xs text-zinc-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2 w-24">
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  value={section.sortOrder}
                                  onChange={(e) => {
                                    const value = Number(e.target.value || 0);
                                    const next = [...layoutConfig.sections];
                                    const idx = next.findIndex(
                                      (s) => s.id === section.id,
                                    );
                                    if (idx === -1) return;
                                    next[idx] = { ...next[idx], sortOrder: value };
                                    setLayoutConfig({
                                      ...layoutConfig,
                                      sections: next,
                                    });
                                  }}
                                />
                              </td>
                              <td className="px-3 py-2 text-center w-20">
                                <input
                                  type="checkbox"
                                  checked={section.enabled}
                                  onChange={(e) => {
                                    const next = [...layoutConfig.sections];
                                    const idx = next.findIndex(
                                      (s) => s.id === section.id,
                                    );
                                    if (idx === -1) return;
                                    next[idx] = {
                                      ...next[idx],
                                      enabled: e.target.checked,
                                    };
                                    setLayoutConfig({
                                      ...layoutConfig,
                                      sections: next,
                                    });
                                  }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
