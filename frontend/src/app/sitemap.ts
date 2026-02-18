
import { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Product = {
  id: string;
  updatedAt: string;
};

async function getProducts(): Promise<Product[]> {
  try {
    // Timeout to prevent hanging during build
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(`${API_URL}/products?limit=1000`, { 
        signal: controller.signal,
        next: { revalidate: 3600 } 
    }).catch(() => null); // Catch network errors
    
    clearTimeout(timeoutId);

    if (!res || !res.ok) return [];
    
    const data = await res.json().catch(() => null); // Catch JSON parse errors
    if (!data) return [];

    type RawProduct = { id: string | number; updatedAt?: string };
    let items: RawProduct[] = [];
    if (Array.isArray(data)) {
        items = data as RawProduct[];
    } else if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: unknown }).items)) {
        items = (data as { items: RawProduct[] }).items;
    }
    
    return items.map((item) => ({
        id: String(item.id),
        updatedAt: item.updatedAt || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Failed to fetch products for sitemap', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://soletrade.com';
  const products = await getProducts();

  const productUrls = products.map((product) => ({
    url: `${baseUrl}/en/product/${product.id}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const staticUrls = [
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/en/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/en/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  return [...staticUrls, ...productUrls];
}
