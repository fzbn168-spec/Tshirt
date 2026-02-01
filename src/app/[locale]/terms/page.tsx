
import { useTranslations } from 'next-intl';

export default function TermsPage() {
  const t = useTranslations('Terms');

  return (
    <div className="bg-white px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-6 text-xl leading-8">
          {t('lastUpdated')}: {new Date().toLocaleDateString()}
        </p>
        <div className="mt-10 max-w-2xl">
          <p>
            {t('intro')}
          </p>
          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
            {t('usageTitle')}
          </h2>
          <p className="mt-6">
            {t('usageText')}
          </p>
          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
            {t('intellectualPropertyTitle')}
          </h2>
          <p className="mt-6">
            {t('intellectualPropertyText')}
          </p>
          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
            {t('liabilityTitle')}
          </h2>
          <p className="mt-6">
            {t('liabilityText')}
          </p>
        </div>
      </div>
    </div>
  );
}
