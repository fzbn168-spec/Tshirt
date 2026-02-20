import Image from 'next/image';
import { Link } from '@/navigation';

type BrandLogo = {
  id: string;
  name: string;
  imageUrl: string;
  href: string;
};

type BrandWallProps = {
  title?: string;
  subtitle?: string;
  logos: BrandLogo[];
};

export function BrandWall({ title, subtitle, logos }: BrandWallProps) {
  if (!logos || logos.length === 0) return null;

  return (
    <section className="py-12 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              {title || '合作品牌'}
            </h2>
            {subtitle && (
              <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
          {logos.map((logo) => (
            <Link
              key={logo.id}
              href={logo.href || '/products'}
              className="group flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-blue-500 hover:shadow-sm transition-colors"
            >
              {logo.imageUrl ? (
                <div className="relative w-28 h-10 md:w-32 md:h-12">
                  <Image
                    src={logo.imageUrl}
                    alt={logo.name || ''}
                    fill
                    sizes="120px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {logo.name || 'Brand'}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

