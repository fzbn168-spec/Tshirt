import { Leaf, Recycle, Heart, Droplets } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SustainabilityPage() {
  const t = useTranslations('Sustainability');

  const initiatives = [
    {
      name: t('initiatives.materials'),
      description: t('initiatives.materialsDesc'),
      icon: Leaf,
    },
    {
      name: t('initiatives.water'),
      description: t('initiatives.waterDesc'),
      icon: Droplets,
    },
    {
      name: t('initiatives.waste'),
      description: t('initiatives.wasteDesc'),
      icon: Recycle,
    },
    {
      name: t('initiatives.labor'),
      description: t('initiatives.laborDesc'),
      icon: Heart,
    },
  ];

  return (
    <div className="bg-white">
      <div className="relative isolate overflow-hidden bg-green-900 py-24 sm:py-32">
        <img
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=2813&q=80"
          alt="Green nature"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-20"
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">{t('title')}</h2>
            <p className="mt-6 text-lg leading-8 text-green-100">
              {t('description')}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-green-600">{t('commitment')}</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('commitmentSubtitle')}
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            {initiatives.map((initiative) => (
              <div key={initiative.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                    <initiative.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {initiative.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{initiative.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
