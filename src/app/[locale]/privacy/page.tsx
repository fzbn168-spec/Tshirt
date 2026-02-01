
import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
  const t = useTranslations('Privacy');

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
            {t('dataCollectionTitle')}
          </h2>
          <p className="mt-6">
            {t('dataCollectionText')}
          </p>
          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
            {t('dataUsageTitle')}
          </h2>
          <p className="mt-6">
            {t('dataUsageText')}
          </p>
          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">
            {t('contactTitle')}
          </h2>
          <p className="mt-6">
            {t('contactText')}
          </p>
        </div>
      </div>
    </div>
  );
}
