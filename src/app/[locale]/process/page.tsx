import { ClipboardList, Scissors, PenTool, Truck, CheckCircle2, Package } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ProcessPage() {
  const t = useTranslations('Process');

  const steps = [
    {
      name: t('steps.consultation'),
      description: t('steps.consultationDesc'),
      icon: PenTool,
    },
    {
      name: t('steps.sourcing'),
      description: t('steps.sourcingDesc'),
      icon: Scissors,
    },
    {
      name: t('steps.planning'),
      description: t('steps.planningDesc'),
      icon: ClipboardList,
    },
    {
      name: t('steps.manufacturing'),
      description: t('steps.manufacturingDesc'),
      icon: Package,
    },
    {
      name: t('steps.qc'),
      description: t('steps.qcDesc'),
      icon: CheckCircle2,
    },
    {
      name: t('steps.delivery'),
      description: t('steps.deliveryDesc'),
      icon: Truck,
    },
  ];

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">{t('title')}</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('subtitle')}
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            {t('description')}
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {steps.map((step) => (
              <div key={step.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <step.icon className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                  {step.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{step.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
