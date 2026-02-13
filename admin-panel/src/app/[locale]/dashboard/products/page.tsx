
import { useTranslations } from 'next-intl';

export default function ProductsPage() {
  const t = useTranslations('Admin');
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{t('productTitle')}</h1>
      <p>Product management table will go here.</p>
    </div>
  );
}
