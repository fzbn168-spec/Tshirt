'use client';

import { useTranslations } from 'next-intl';
import { ShieldCheck, Globe, Users, PackageCheck, Award, FileCheck } from 'lucide-react';

export function TrustSection() {
  const t = useTranslations('Home.trust');

  const stats = [
    {
      id: 'experience',
      value: '15+',
      label: t('stats.experience'),
      icon: Award,
      color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/20'
    },
    {
      id: 'countries',
      value: '50+',
      label: t('stats.countries'),
      icon: Globe,
      color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20'
    },
    {
      id: 'partners',
      value: '500+',
      label: t('stats.partners'),
      icon: Users,
      color: 'text-green-500 bg-green-100 dark:bg-green-900/20'
    },
    {
      id: 'shipped',
      value: '1M+',
      label: t('stats.shipped'),
      icon: PackageCheck,
      color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/20'
    }
  ];

  const certs = [
    { id: 'sgs', label: t('certifications.sgs'), icon: ShieldCheck },
    { id: 'iso', label: t('certifications.iso'), icon: FileCheck },
    { id: 'bsci', label: t('certifications.bsci'), icon: Award },
  ];

  return (
    <section className="py-20 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-zinc-900 dark:text-white">
            {t('title')}
          </h2>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat) => (
            <div key={stat.id} className="text-center p-6 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Certifications Banner */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-2">{t('certifications.title')}</h3>
              <p className="text-zinc-500 text-sm">
                We adhere to the highest international standards for quality and social responsibility.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              {certs.map((cert) => (
                <div key={cert.id} className="flex items-center gap-3 px-6 py-3 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <cert.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    {cert.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
