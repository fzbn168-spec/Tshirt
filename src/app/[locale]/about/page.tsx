import { Award, Globe, Users, History } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AboutPage() {
  const t = useTranslations('About');

  const stats = [
    { name: t('stats.experience'), value: '15+' },
    { name: t('stats.countries'), value: '50+' },
    { name: t('stats.capacity'), value: '500k+' },
    { name: t('stats.clients'), value: '200+' },
  ];

  const values = [
    {
      name: t('values.quality'),
      description: t('values.qualityDesc'),
      icon: Award,
    },
    {
      name: t('values.customer'),
      description: t('values.customerDesc'),
      icon: Users,
    },
    {
      name: t('values.global'),
      description: t('values.globalDesc'),
      icon: Globe,
    },
    {
      name: t('values.heritage'),
      description: t('values.heritageDesc'),
      icon: History,
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
        <img
          src="https://images.unsplash.com/photo-1556906781-9a412961d289?ixlib=rb-4.0.3&auto=format&fit=crop&w=2832&q=80"
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-20"
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">{t('title')}</h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              {t('description')}
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-none">
            <dl className="mt-16 grid grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.name} className="flex flex-col-reverse">
                  <dt className="text-base leading-7 text-gray-300">{stat.name}</dt>
                  <dd className="text-2xl font-bold leading-9 tracking-tight text-white">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Values section */}
      <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8 lg:mb-32">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Our Values</h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            We believe in sustainable growth, ethical manufacturing, and building long-term relationships with our clients.
          </p>
        </div>
        <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 text-base leading-7 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          {values.map((value) => (
            <div key={value.name}>
              <dt className="font-semibold text-gray-900">
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                  <value.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                {value.name}
              </dt>
              <dd className="mt-1 text-gray-600">{value.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
