import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { deleteProduct } from '@/lib/product-actions';

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus size={20} />
          Add Product
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {products.map((product) => (
            <li key={product.id}>
              <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt="" className="h-12 w-12 object-cover rounded bg-gray-100" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                      No Img
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-indigo-600 truncate">{product.nameEn}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={async () => {
                    'use server';
                    await deleteProduct(product.id);
                  }}>
                    <button className="text-red-400 hover:text-red-500 p-2">
                        <Trash2 size={20} />
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
          {products.length === 0 && (
             <li className="px-4 py-12 text-center text-gray-500">
                No products found. Click "Add Product" to create one.
             </li>
          )}
        </ul>
      </div>
    </div>
  );
}
