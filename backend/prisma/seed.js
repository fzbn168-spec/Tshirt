const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create Platform Admin
  const adminEmail = 'admin@platform.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: 'Platform Administrator',
        role: 'PLATFORM_ADMIN',
      },
    });
    console.log('Created Platform Admin: admin@platform.com / admin123');
  }

  // 2. Ensure Attributes exist
  const attributeIds = {};
  const attributes = [
    {
      code: 'color',
      name: { en: "Color", zh: "颜色" },
      type: 'color',
      values: [
        { value: { en: "Red", zh: "红色" }, meta: "#FF0000" },
        { value: { en: "Blue", zh: "蓝色" }, meta: "#0000FF" },
        { value: { en: "Black", zh: "黑色" }, meta: "#000000" },
        { value: { en: "White", zh: "白色" }, meta: "#FFFFFF" },
        { value: { en: "Green", zh: "绿色" }, meta: "#008000" },
        { value: { en: "Brown", zh: "棕色" }, meta: "#A52A2A" },
      ]
    },
    {
      code: 'size',
      name: { en: "Size", zh: "尺码" },
      type: 'text',
      values: [
        { value: { en: "S", zh: "S" } },
        { value: { en: "M", zh: "M" } },
        { value: { en: "L", zh: "L" } },
        { value: { en: "XL", zh: "XL" } },
        { value: { en: "XXL", zh: "XXL" } },
        { value: { en: "36", zh: "36" } },
        { value: { en: "37", zh: "37" } },
        { value: { en: "38", zh: "38" } },
        { value: { en: "39", zh: "39" } },
        { value: { en: "40", zh: "40" } },
        { value: { en: "41", zh: "41" } },
        { value: { en: "42", zh: "42" } },
        { value: { en: "43", zh: "43" } },
        { value: { en: "44", zh: "44" } },
        { value: { en: "45", zh: "45" } },
      ]
    },
    {
      code: 'material',
      name: { en: "Material", zh: "材质" },
      type: 'text',
      values: [
        { value: { en: "Leather", zh: "真皮" } },
        { value: { en: "Canvas", zh: "帆布" } },
        { value: { en: "Synthetic", zh: "合成革" } },
        { value: { en: "Mesh", zh: "网面" } },
      ]
    }
  ];

  for (const attr of attributes) {
    let existing = await prisma.attribute.findFirst({ where: { code: attr.code } });
    if (!existing) {
      existing = await prisma.attribute.create({
        data: {
          name: JSON.stringify(attr.name),
          code: attr.code,
          type: attr.type,
        }
      });
      console.log(`Created attribute: ${attr.code}`);
    }
    attributeIds[attr.code] = existing.id;

    // Ensure values exist
    for (const val of attr.values) {
      const valStr = JSON.stringify(val.value);
      const existingVal = await prisma.attributeValue.findFirst({
        where: { attributeId: existing.id, value: valStr }
      });
      if (!existingVal) {
        await prisma.attributeValue.create({
          data: {
            attributeId: existing.id,
            value: valStr,
            meta: val.meta
          }
        });
      }
    }
  }

  // 3. Define Categories and Products
  const categoriesData = [
    {
      slug: 'men-shoes',
      name: { en: "Men's Shoes", zh: "男鞋" },
      children: [
        {
          slug: 'men-sneakers',
          name: { en: "Sneakers", zh: "运动鞋" },
          products: [
            {
              title: { en: "Pro Running Shoes 2024", zh: "2024专业跑鞋" },
              price: 55.00,
              image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"
            },
            {
              title: { en: "Casual Street Sneakers", zh: "休闲街头板鞋" },
              price: 35.00,
              image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80"
            },
            {
              title: { en: "Breathable Mesh Runners", zh: "透气网面跑鞋" },
              price: 42.00,
              image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80"
            }
          ]
        },
        {
          slug: 'men-boots',
          name: { en: "Boots", zh: "靴子" },
          products: [
            {
              title: { en: "Classic Leather Boots", zh: "经典真皮靴" },
              price: 89.00,
              image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80"
            },
            {
              title: { en: "Tactical Combat Boots", zh: "战术作战靴" },
              price: 65.00,
              image: "https://images.unsplash.com/photo-1605034313761-73ea4a0cfbf3?w=800&q=80"
            }
          ]
        },
        {
          slug: 'men-oxfords',
          name: { en: "Oxfords", zh: "正装鞋" },
          products: [
            {
              title: { en: "Business Formal Oxfords", zh: "商务正装皮鞋" },
              price: 75.00,
              image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&q=80"
            },
            {
              title: { en: "Suede Loafers", zh: "绒面乐福鞋" },
              price: 58.00,
              image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&q=80"
            }
          ]
        }
      ]
    },
    {
      slug: 'women-shoes',
      name: { en: "Women's Shoes", zh: "女鞋" },
      children: [
        {
          slug: 'women-heels',
          name: { en: "Heels", zh: "高跟鞋" },
          products: [
            {
              title: { en: "Elegant Stiletto Heels", zh: "优雅细跟高跟鞋" },
              price: 48.00,
              image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80"
            },
            {
              title: { en: "Block Heel Sandals", zh: "粗跟凉鞋" },
              price: 32.00,
              image: "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=800&q=80"
            }
          ]
        },
        {
          slug: 'women-boots',
          name: { en: "Boots", zh: "靴子" },
          products: [
            {
              title: { en: "Ankle Boots", zh: "及踝靴" },
              price: 55.00,
              image: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80"
            },
            {
              title: { en: "High Knee Boots", zh: "过膝长靴" },
              price: 78.00,
              image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80"
            }
          ]
        }
      ]
    },
    {
      slug: 'sports-shoes',
      name: { en: "Sports & Outdoor", zh: "运动户外" },
      children: [
        {
          slug: 'hiking-shoes',
          name: { en: "Hiking", zh: "徒步" },
          products: [
            {
              title: { en: "Waterproof Hiking Boots", zh: "防水徒步鞋" },
              price: 62.00,
              image: "https://images.unsplash.com/photo-1605034313761-73ea4a0cfbf3?w=800&q=80"
            }
          ]
        },
        {
          slug: 'running-shoes',
          name: { en: "Running", zh: "跑步" },
          products: [
            {
              title: { en: "Marathon Running Shoes", zh: "马拉松跑鞋" },
              price: 95.00,
              image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"
            }
          ]
        }
      ]
    },
    {
      slug: 'kids-shoes',
      name: { en: "Kids' Shoes", zh: "童鞋" },
      children: [
        {
          slug: 'kids-sneakers',
          name: { en: "Kids Sneakers", zh: "儿童运动鞋" },
          products: [
            {
              title: { en: "Lightweight Kids Runners", zh: "轻便儿童跑鞋" },
              price: 28.00,
              image: "https://images.unsplash.com/photo-1514989940723-e8875ea2d095?w=800&q=80"
            },
            {
              title: { en: "Velcro School Shoes", zh: "魔术贴校鞋" },
              price: 35.00,
              image: "https://images.unsplash.com/photo-1503449377594-329eea72eb57?w=800&q=80"
            }
          ]
        },
        {
          slug: 'kids-sandals',
          name: { en: "Kids Sandals", zh: "儿童凉鞋" },
          products: [
            {
              title: { en: "Summer Beach Sandals", zh: "夏季沙滩凉鞋" },
              price: 22.00,
              image: "https://images.unsplash.com/photo-1505322101000-19457c43224e?w=800&q=80"
            }
          ]
        }
      ]
    },
    {
      slug: 'apparel',
      name: { en: "Apparel", zh: "服装" },
      children: [
        {
          slug: 'jerseys',
          name: { en: "Jerseys", zh: "球服" },
          products: [
            {
              title: { en: "Pro Soccer Jersey 2024", zh: "2024专业足球服" },
              price: 35.00,
              image: "https://images.unsplash.com/photo-1577212017184-80cc0da11373?w=800&q=80"
            },
            {
              title: { en: "Basketball Team Kit", zh: "篮球队服套装" },
              price: 45.00,
              image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&q=80"
            }
          ]
        },
        {
          slug: 't-shirts',
          name: { en: "T-Shirts", zh: "T恤" },
          products: [
            {
              title: { en: "Cotton Basic Tee", zh: "纯棉基础T恤" },
              price: 15.00,
              image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"
            },
            {
              title: { en: "Graphic Print T-Shirt", zh: "印花潮流T恤" },
              price: 22.00,
              image: "https://images.unsplash.com/photo-1503341455253-b2e72333dbdb?w=800&q=80"
            }
          ]
        },
        {
          slug: 'jackets',
          name: { en: "Jackets", zh: "夹克" },
          products: [
            {
              title: { en: "Windbreaker Sports Jacket", zh: "防风运动夹克" },
              price: 55.00,
              image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80"
            },
            {
              title: { en: "Winter Puffer Coat", zh: "冬季羽绒服" },
              price: 85.00,
              image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80"
            }
          ]
        },
        {
          slug: 'sportswear',
          name: { en: "Sportswear", zh: "运动服" },
          products: [
            {
              title: { en: "Quick-Dry Training Set", zh: "速干训练套装" },
              price: 40.00,
              image: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&q=80"
            },
            {
              title: { en: "Yoga Activewear", zh: "瑜伽健身服" },
              price: 38.00,
              image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&q=80"
            }
          ]
        }
      ]
    },
    {
      slug: 'accessories',
      name: { en: "Accessories", zh: "配件" },
      children: [
        {
          slug: 'shoe-care',
          name: { en: "Shoe Care", zh: "鞋护" },
          products: [
            {
              title: { en: "Premium Shoe Polish", zh: "高级鞋油" },
              price: 12.00,
              image: "https://images.unsplash.com/photo-1627453006450-482d85419992?w=800&q=80"
            },
            {
              title: { en: "Shoe Cleaning Kit", zh: "洗鞋套装" },
              price: 18.00,
              image: "https://images.unsplash.com/photo-1598532213618-9366e85d9c22?w=800&q=80"
            }
          ]
        }
      ]
    }
  ];

  for (const catData of categoriesData) {
    console.log(`Processing category: ${catData.slug}`);
    let parentCategory = await prisma.category.findUnique({ where: { slug: catData.slug } });
    if (!parentCategory) {
      parentCategory = await prisma.category.create({
        data: {
          slug: catData.slug,
          name: JSON.stringify(catData.name),
        }
      });
      console.log(`Created category: ${catData.slug}`);
    }

    if (catData.children) {
      for (const childData of catData.children) {
        let childCategory = await prisma.category.findUnique({ where: { slug: childData.slug } });
        if (!childCategory) {
          childCategory = await prisma.category.create({
            data: {
              slug: childData.slug,
              name: JSON.stringify(childData.name),
              parentId: parentCategory.id,
            }
          });
          console.log(`Created category: ${childData.slug}`);
        }

        if (childData.products) {
          for (const prodData of childData.products) {
             // Check if product exists by similar title (simplified check)
             const existingProduct = await prisma.product.findFirst({
                 where: {
                     title: { contains: prodData.title.en }
                 }
             });

             if (!existingProduct) {
                 const product = await prisma.product.create({
                     data: {
                         categoryId: childCategory.id,
                         title: JSON.stringify(prodData.title),
                         description: JSON.stringify({
                             en: `<p>${prodData.title.en} - High quality product.</p>`,
                             zh: `<p>${prodData.title.zh} - 高品质产品。</p>`
                         }),
                         images: JSON.stringify([prodData.image]),
                         basePrice: prodData.price,
                         specsTemplate: JSON.stringify({ colors: ["Black", "White"], sizes: ["40", "41", "42"] }),
                         hsCode: "64039111",
                         isPublished: true,
                     }
                 });
                 console.log(`Created product: ${prodData.title.en}`);

                 // Create SKUs
                 const colors = ["Black", "White"];
                 let sizes = ["40", "41", "42"];

                 // Use letter sizes for apparel
                 if (catData.slug === 'apparel' || childCategory.slug.includes('jerseys') || childCategory.slug.includes('t-shirts') || childCategory.slug.includes('jackets') || childCategory.slug.includes('sportswear')) {
                    sizes = ["S", "M", "L", "XL"];
                 }
                 
                 for (const color of colors) {
                     for (const size of sizes) {
                         await prisma.sku.create({
                             data: {
                                 productId: product.id,
                                 skuCode: `${childCategory.slug.substring(0,3).toUpperCase()}-${product.id.substring(0,4)}-${color.substring(0,1)}-${size}`,
                                 specs: JSON.stringify({ color, size }),
                                 price: prodData.price,
                                 moq: 10,
                                 stock: 100
                             }
                         });
                     }
                 }
             }
          }
        }
      }
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
