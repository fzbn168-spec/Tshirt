import { MetadataRoute } from 'next';
import { getProducts } from '@/lib/data';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tshirt-h64b.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['en', 'zh'];
  const routes = ['', '/products', '/about', '/contact', '/process', '/sustainability'];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  locales.forEach(locale => {
    // Static routes
    routes.forEach(route => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
      });
    });

    // Dynamic product routes
    const products = getProducts(locale);
    products.forEach(product => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/products/${product.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    });
  });

  return sitemapEntries;
}
