
import { useTranslations } from 'next-intl';

export default function OrdersPage() {
  const t = useTranslations('Admin');
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{t('orderMgmt')}</h1>
      <p>Order management table will go here.</p>
    </div>
  );
}
