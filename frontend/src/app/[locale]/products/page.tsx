
import { useTranslations } from 'next-intl';
import { ProductFilters } from './_components/ProductFilters';
import { ProductGrid } from './_components/ProductGrid';
import { Suspense } from 'react';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function ProductsPage() {
  const t = useTranslations('Home'); // Reusing Home translations for now or create generic ones

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Mobile Filter Button */}
      <div className="md:hidden mb-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Show Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] sm:w-[380px] overflow-y-auto p-6">
            <div className="mt-6">
              <ProductFilters />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-24">
             <Suspense fallback={<div className="h-64 animate-pulse bg-zinc-100 rounded"></div>}>
               <ProductFilters />
             </Suspense>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-grow">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Product Catalog</h1>
            <p className="text-zinc-500">Explore our wide range of wholesale products.</p>
          </div>
          
          <Suspense fallback={
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          }>
            <ProductGrid />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
