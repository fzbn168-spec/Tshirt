import { createProduct } from '@/lib/product-actions';

export default function NewProductPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h1>
      
      <form action={createProduct} className="space-y-6 bg-white p-6 shadow rounded-lg">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Name (English)</label>
            <input type="text" name="nameEn" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Name (Chinese)</label>
            <input type="text" name="nameZh" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select name="category" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
              <option value="T-Shirt">T-Shirt</option>
              <option value="Hoodie">Hoodie</option>
              <option value="Pants">Pants</option>
              <option value="Jacket">Jacket</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description (English)</label>
            <textarea name="descEn" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"></textarea>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description (Chinese)</label>
            <textarea name="descZh" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"></textarea>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Price (Optional)</label>
            <input type="text" name="price" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Product Image</label>
            <input type="file" name="image" accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          </div>
        </div>

        <div className="flex justify-end pt-4">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                Create Product
            </button>
        </div>
      </form>
    </div>
  );
}
