
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailClient } from './_components/ProductDetailClient';

// Helper to fetch product data
async function getProduct(id: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      next: { revalidate: 60 }, // Revalidate every 60s
    });
    
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
}

// Helper to parse localized strings
const getLocStr = (jsonStr: string) => {
  try {
    const obj = JSON.parse(jsonStr || '{}');
    return obj.en || obj.zh || '';
  } catch {
    return jsonStr;
  }
};

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

// 1. Generate Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const title = getLocStr(product.title);
  const description = getLocStr(product.description);
  const images = JSON.parse(product.images || '[]');

  return {
    title: title,
    description: description.substring(0, 160), // SEO optimal length
    openGraph: {
      title: title,
      description: description,
      images: images.map((url: string) => ({ url })),
    },
  };
}

// 2. Main Page Component (Server Side)
export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const title = getLocStr(product.title);
  const description = getLocStr(product.description);
  const images = JSON.parse(product.images || '[]');
  const price = product.basePrice;

  // 3. Generate JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    image: images,
    description: description,
    sku: product.skus[0]?.skuCode || id,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: price, // Should ideally be min price from SKUs
      offerCount: product.skus.length,
      availability: 'https://schema.org/InStock',
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://soletrade.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: 'https://soletrade.com/products',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: `https://soletrade.com/product/${id}`,
      },
    ],
  };

  return (
    <>
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      
      {/* Render Client Component */}
      <ProductDetailClient product={product} />
    </>
  );
}
