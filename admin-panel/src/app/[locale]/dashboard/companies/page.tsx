
import { useTranslations } from 'next-intl';

export default function CompaniesPage() {
  const t = useTranslations('Admin');
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{t('companyTitle')}</h1>
      <p>Company audit table will go here.</p>
    </div>
  );
}
