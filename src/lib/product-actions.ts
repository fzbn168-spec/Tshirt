'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { put } from '@vercel/blob';

export async function createProduct(formData: FormData) {
  const nameEn = formData.get('nameEn') as string;
  const nameZh = formData.get('nameZh') as string;
  const descEn = formData.get('descEn') as string;
  const descZh = formData.get('descZh') as string;
  const category = formData.get('category') as string;
  const price = formData.get('price') as string;
  const imageFile = formData.get('image') as File;

  let imageUrls: string[] = [];
  
  if (imageFile && imageFile.size > 0) {
    try {
        const blob = await put(imageFile.name, imageFile, {
            access: 'public',
        });
        imageUrls.push(blob.url);
    } catch (error) {
        console.error('Image upload failed:', error);
        // Continue without image or handle error
    }
  }

  // Generate slug
  const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  await prisma.product.create({
    data: {
      nameEn,
      nameZh,
      descEn,
      descZh,
      category,
      price,
      slug,
      images: imageUrls,
    },
  });

  revalidatePath('/admin/products');
  redirect('/admin/products');
}

export async function deleteProduct(id: string) {
    await prisma.product.delete({
        where: { id }
    });
    revalidatePath('/admin/products');
}
