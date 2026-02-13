
import { useTranslations } from 'next-intl';

export default function InquiriesPage() {
  const t = useTranslations('Admin');
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{t('inquiryMgmt')}</h1>
      <p>Inquiry management table will go here.</p>
    </div>
  );
}
