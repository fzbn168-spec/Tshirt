import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import PDFDocument from 'pdfkit';
import { TranslationService } from '../translation/translation.service';
import { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private translationService: TranslationService,
  ) {}

  async importFromExcel(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Pre-fetch or create common attributes
    // 预先确保系统中有 Color 和 Size 属性
    const colorAttr = await this.ensureAttribute('Color', 'color');
    const sizeAttr = await this.ensureAttribute('Size', 'size');

    for (const [index, row] of data.entries()) {
      try {
        const {
          Title,
          Description,
          BasePrice,
          CategorySlug,
          MOQ,
          SKUCode,
          Color,
          Size,
        } = row as any;

        if (!Title || !BasePrice || !CategorySlug) {
          throw new Error(
            'Missing required fields: Title, BasePrice, CategorySlug',
          );
        }

        // 1. Find or Create Category
        const category = await this.prisma.category.findUnique({
          where: { slug: CategorySlug },
        });

        if (!category) {
          throw new Error(`Category not found: ${CategorySlug}`);
        }

        // 2. Find or Create Product (by Title)
        let product = await this.prisma.product.findFirst({
          where: {
            title: { contains: Title },
          },
        });

        if (!product) {
          product = await this.prisma.product.create({
            data: {
              title: JSON.stringify({ en: Title }),
              description: JSON.stringify({ en: Description || '' }),
              basePrice: Number(BasePrice),
              categoryId: category.id,
              images: JSON.stringify([]),
              specsTemplate: JSON.stringify({}),
              isPublished: true,
            },
          });
        }

        // 3. Create SKU if SKUCode provided
        if (SKUCode) {
          // A. 处理属性值 (Color/Size)
          const attributeValueIds: string[] = [];

          if (Color) {
            const val = await this.ensureAttributeValue(colorAttr.id, Color);
            attributeValueIds.push(val.id);
            // 同时也关联到 Product 上
            await this.linkAttributeToProduct(product.id, colorAttr.id);
          }

          if (Size) {
            const val = await this.ensureAttributeValue(
              sizeAttr.id,
              String(Size),
            );
            attributeValueIds.push(val.id);
            await this.linkAttributeToProduct(product.id, sizeAttr.id);
          }

          // B. 构建 Specs JSON (为了向后兼容)
          const specs: any = {};
          if (Color) specs.color = Color;
          if (Size) specs.size = Size;

          const existingSku = await this.prisma.sku.findUnique({
            where: { skuCode: String(SKUCode) },
          });

          if (!existingSku) {
            await this.prisma.sku.create({
              data: {
                productId: product.id,
                skuCode: String(SKUCode),
                price: Number(BasePrice),
                moq: Number(MOQ) || 1,
                specs: JSON.stringify(specs),
                stock: 100,
                // C. 关联结构化属性值
                attributeValues: {
                  create: attributeValueIds.map((id) => ({
                    attributeValueId: id,
                  })),
                },
              },
            });
          }
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${index + 2}: ${error.message}`);
      }
    }

    return results;
  }

  // Helper: Ensure Attribute exists
  private async ensureAttribute(nameEn: string, code: string) {
    let attr = await this.prisma.attribute.findUnique({
      where: { code },
    });
    if (!attr) {
      attr = await this.prisma.attribute.create({
        data: {
          name: JSON.stringify({
            en: nameEn,
            zh: nameEn === 'Color' ? '颜色' : '尺码',
          }),
          code,
          type: 'text',
        },
      });
    }
    return attr;
  }

  // Helper: Ensure AttributeValue exists
  private async ensureAttributeValue(attributeId: string, valueEn: string) {
    // 简单的查找逻辑 (实际可能需要更复杂的匹配，忽略大小写等)
    let val = await this.prisma.attributeValue.findFirst({
      where: {
        attributeId,
        value: { contains: valueEn }, // 简化匹配
      },
    });

    if (!val) {
      val = await this.prisma.attributeValue.create({
        data: {
          attributeId,
          value: JSON.stringify({ en: valueEn, zh: valueEn }), // 暂时 zh = en
        },
      });
    }
    return val;
  }

  // Helper: Link Attribute to Product (Idempotent)
  private async linkAttributeToProduct(productId: string, attributeId: string) {
    try {
      await this.prisma.productAttribute.upsert({
        where: {
          productId_attributeId: {
            productId,
            attributeId,
          },
        },
        update: {},
        create: {
          productId,
          attributeId,
        },
      });
    } catch (e) {
      // Ignore race conditions
    }
  }

  async generateCatalogPdf(): Promise<Buffer> {
    const products = await this.prisma.product.findMany({
      take: 50,
      include: {
        category: true,
        skus: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Title
      doc.fontSize(24).text('Product Catalog', { align: 'center' });
      doc.fontSize(10).text(`Generated on ${new Date().toLocaleDateString()}`, {
        align: 'center',
      });
      doc.moveDown(2);

      // List
      products.forEach((product, index) => {
        // Avoid page break inside item if possible, or just let it flow
        if (doc.y > 700) doc.addPage();

        const title = JSON.parse(product.title).en || 'Product';
        doc.fontSize(14).font('Helvetica-Bold').text(title);
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(
            `Category: ${product.category?.name ? JSON.parse(product.category.name).en || '-' : '-'}`,
          );
        doc.text(`Price: From $${Number(product.basePrice).toFixed(2)}`);
        doc.text(`MOQ: ${product.skus[0]?.moq || 1}`);
        doc.moveDown(0.5);

        const desc = JSON.parse(product.description).en || '';
        doc
          .fontSize(9)
          .text(desc.substring(0, 200) + (desc.length > 200 ? '...' : ''), {
            width: 500,
            align: 'justify',
          });

        doc.moveDown(1.5);
      });

      doc.end();
    });
  }

  async create(createProductDto: CreateProductDto) {
    const { skus, attributeIds, ...productData } = createProductDto;

    // Auto Translate Title & Description
    if (productData.title) {
      try {
        const titleObj = JSON.parse(productData.title);
        const translated = await this.translationService.autoFill(titleObj);
        productData.title = JSON.stringify(translated);
      } catch (e) {}
    }

    if (productData.description) {
      try {
        const descObj = JSON.parse(productData.description);
        const translated = await this.translationService.autoFill(descObj);
        productData.description = JSON.stringify(translated);
      } catch (e) {}
    }

    try {
      return await this.prisma.product.create({
        data: {
          ...productData,
          sizeChartId: createProductDto.sizeChartId,
          attributes: attributeIds
            ? {
                create: attributeIds.map((id) => ({ attributeId: id })),
              }
            : undefined,
          skus: {
            create: skus.map((sku) => {
              const { attributeValueIds, ...skuData } = sku;
              return {
                ...skuData,
                attributeValues: attributeValueIds
                  ? {
                      create: attributeValueIds.map((id) => ({
                        attributeValueId: id,
                      })),
                    }
                  : undefined,
              };
            }),
          },
        },
        include: {
          skus: {
            include: {
              attributeValues: {
                include: { attributeValue: true },
              },
            },
          },
          attributes: {
            include: {
              attribute: {
                include: { values: true },
              },
            },
          },
          category: true,
          sizeChart: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('SKU Code already exists');
        }
      }
      throw error;
    }
  }

  async findAll(params?: {
    search?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    attributes?: Record<string, string[]>;
    sort?: string;
    skip?: number;
    take?: number;
    ids?: string[];
  }) {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      attributes,
      sort,
      skip,
      take,
      ids,
    } = params || {};

    const where: any = {};

    if (ids && ids.length > 0) {
      where.id = { in: ids };
    } else {
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
          { skus: { some: { skuCode: { contains: search } } } },
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.basePrice = {};
        if (minPrice !== undefined) where.basePrice.gte = minPrice;
        if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
      }
    }

    // Attribute Filtering
    if (attributes && Object.keys(attributes).length > 0) {
      /**
       * 复杂筛选逻辑：
       *
       * 我们需要找到那些“至少有一个 SKU 匹配所有选定属性值”的商品。
       *
       * 示例：
       * 用户选择了 颜色: [红, 蓝] 且 尺码: [40, 41]
       *
       * 1. `attributeConditions` 为每种属性类型创建一个条件数组。
       *    例如 [{ attributeValues: { some: { id: IN [红, 蓝] } } }, { attributeValues: { some: { id: IN [40, 41] } } }]
       *
       * 2. `where.skus` 使用 `some` -> `AND` 逻辑：
       *    "找到一个商品，它有一些 SKU 满足 (Sku.Color 是 红 或 蓝) 且 (Sku.Size 是 40 或 41)"
       */
      const attributeConditions = Object.entries(attributes).map(
        ([attrId, valueIds]) => ({
          attributeValues: {
            some: {
              attributeValueId: { in: valueIds },
            },
          },
        }),
      );

      // Ensure at least one SKU matches ALL attribute conditions
      where.skus = {
        some: {
          AND: attributeConditions,
        },
      };
    }

    const total = await this.prisma.product.count({ where });

    let orderBy: any = { createdAt: 'desc' };

    if (sort === 'priceAsc') {
      orderBy = { basePrice: 'asc' };
    } else if (sort === 'priceDesc') {
      orderBy = { basePrice: 'desc' };
    } else if (sort === 'sales') {
      orderBy = {
        soldCount: 'desc',
      };
    } else if (sort === 'hot') {
      orderBy = [
        {
          soldCount: 'desc',
        },
        {
          fakeSoldCount: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ];
    }
    const items = await this.prisma.product.findMany({
      where,
      include: {
        skus: {
          include: {
            attributeValues: {
              include: { attributeValue: true },
            },
          },
        },
        attributes: {
          include: {
            attribute: {
              include: { values: true },
            },
          },
        },
        category: true,
      },
      orderBy,
      skip,
      take,
    });

    if (ids && ids.length > 0) {
      const orderMap = new Map(ids.map((id, index) => [id, index]));
      items.sort((a, b) => {
        const ai = orderMap.get(a.id) ?? 0;
        const bi = orderMap.get(b.id) ?? 0;
        return ai - bi;
      });
    }

    return { total, items };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        skus: {
          include: {
            attributeValues: {
              include: { attributeValue: true },
            },
          },
        },
        attributes: {
          include: {
            attribute: {
              include: { values: true },
            },
          },
        },
        category: true,
        sizeChart: true,
        // Include summary of reviews or just count?
        // For now, product.soldCount and fakeSoldCount are already fetched by default.
      },
    });

    if (
      product &&
      product.attributes.length === 0 &&
      product.skus.some((sku) => sku.attributeValues.length > 0)
    ) {
      const attrIdSet = new Set<string>();
      product.skus.forEach((sku) => {
        sku.attributeValues.forEach((av) => {
          if (av.attributeValue.attributeId) {
            attrIdSet.add(av.attributeValue.attributeId);
          }
        });
      });

      const attributeIds = Array.from(attrIdSet);

      if (attributeIds.length > 0) {
        await this.prisma.productAttribute.createMany({
          data: attributeIds.map((attributeId) => ({
            productId: id,
            attributeId,
          })),
        });

        const attributes = await this.prisma.productAttribute.findMany({
          where: { productId: id },
          include: {
            attribute: {
              include: { values: true },
            },
          },
        });

        return {
          ...product,
          attributes,
        };
      }
    }

    return product;
  }

  async updateSalesCount(id: string, fakeSoldCount: number) {
    return this.prisma.product.update({
      where: { id },
      data: { fakeSoldCount },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { skus, attributeIds, fakeSoldCount, ...productData } =
      updateProductDto;

    // Auto Translate Title & Description
    if (productData.title) {
      try {
        const titleObj = JSON.parse(productData.title);
        const translated = await this.translationService.autoFill(titleObj);
        productData.title = JSON.stringify(translated);
      } catch (e) {}
    }

    if (productData.description) {
      try {
        const descObj = JSON.parse(productData.description);
        const translated = await this.translationService.autoFill(descObj);
        productData.description = JSON.stringify(translated);
      } catch (e) {}
    }

    // Update product fields and attributes
    try {
      if (
        Object.keys(productData).length > 0 ||
        attributeIds ||
        fakeSoldCount !== undefined
      ) {
        await this.prisma.$transaction(async (tx) => {
          // 1. Update basic fields
          const updateData: any = { ...productData };
          if (fakeSoldCount !== undefined) {
            updateData.fakeSoldCount = fakeSoldCount;
          }

          if (Object.keys(updateData).length > 0) {
            await tx.product.update({
              where: { id },
              data: updateData,
            });
          }

          // 2. Update Attributes Relation if provided
          if (attributeIds) {
            // ⚠️ DESTRUCTIVE OPERATION ⚠️
            // We delete all existing ProductAttribute relations and recreate them.
            // This is simpler than diffing (finding which to add/remove),
            // but it means we lose `createdAt` history for these relations.
            // Ensure this side effect is acceptable.
            await tx.productAttribute.deleteMany({ where: { productId: id } });

            // Create new relations
            if (attributeIds.length > 0) {
              await tx.productAttribute.createMany({
                data: attributeIds.map((aid) => ({
                  productId: id,
                  attributeId: aid,
                })),
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Update Product Error:', error);
      throw error;
    }

    // Handle SKU updates if provided (Diffing strategy)
    if (skus) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // 1. Fetch existing SKUs
          const existingSkus = await tx.sku.findMany({
            where: { productId: id },
          });
          const existingSkuIds = new Set(existingSkus.map((s) => s.id));
          const incomingSkuIds = new Set(
            skus.map((s) => (s as any).id).filter(Boolean),
          );

          // 2. Identify SKUs to Delete (Existing but not in Incoming)
          const toDelete = existingSkus.filter(
            (s) => !incomingSkuIds.has(s.id),
          );
          if (toDelete.length > 0) {
            await tx.sku.deleteMany({
              where: { id: { in: toDelete.map((s) => s.id) } },
            });
          }

          // 3. Upsert (Update or Create)
          for (const sku of skus) {
            const skuId = (sku as any).id;
            const { attributeValueIds, id: _ignoreId, ...skuData } = sku as any;

            if (skuId && existingSkuIds.has(skuId)) {
              // Update
              await tx.sku.update({
                where: { id: skuId },
                data: {
                  ...skuData,
                  attributeValues: attributeValueIds
                    ? {
                        deleteMany: {}, // Clear old relations
                        create: attributeValueIds.map((aid: string) => ({
                          attributeValueId: aid,
                        })),
                      }
                    : undefined,
                },
              });
            } else {
              // Create
              await tx.sku.create({
                data: {
                  ...skuData,
                  productId: id,
                  attributeValues: attributeValueIds
                    ? {
                        create: attributeValueIds.map((aid: string) => ({
                          attributeValueId: aid,
                        })),
                      }
                    : undefined,
                },
              });
            }
          }
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new ConflictException('SKU Code already exists');
          }
        }
        throw error;
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    // Manually delete SKUs first to ensure no foreign key constraint errors
    // unless Cascade Delete is configured in DB
    const deleteSkus = this.prisma.sku.deleteMany({
      where: { productId: id },
    });
    const deleteProduct = this.prisma.product.delete({
      where: { id },
    });

    return this.prisma.$transaction([deleteSkus, deleteProduct]);
  }

  async addSku(productId: string, skuData: any) {
    return this.prisma.sku.create({
      data: {
        ...skuData,
        productId,
      },
    });
  }

  async generateFeed(type: 'google' | 'facebook' | 'tiktok'): Promise<string> {
    const products = await this.prisma.product.findMany({
      where: { isPublished: true },
      include: {
        category: true,
        skus: true,
      },
    });

    const baseUrl = process.env.FRONTEND_URL || 'https://soletrade.com';
    let xml = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
<title>SoleTrade Product Feed</title>
<link>${baseUrl}</link>
<description>SoleTrade Wholesale Catalog</description>
`;

    for (const product of products) {
      const title = JSON.parse(product.title).en || 'Untitled';
      const description =
        JSON.parse(product.description).en || 'No description';
      const images = JSON.parse(product.images || '[]');
      const image = images.length > 0 ? images[0] : '';
      const price = Number(product.basePrice).toFixed(2);

      xml += `
<item>
<g:id>${product.id}</g:id>
<g:title><![CDATA[${title}]]></g:title>
<g:description><![CDATA[${description}]]></g:description>
<g:link>${baseUrl}/product/${product.id}</g:link>
<g:image_link>${image}</g:image_link>
<g:condition>new</g:condition>
<g:availability>in stock</g:availability>
<g:price>${price} USD</g:price>
<g:brand>SoleTrade</g:brand>
${product.category ? `<g:product_type><![CDATA[${JSON.parse(product.category.name).en || ''}]]></g:product_type>` : ''}
</item>`;
    }

    xml += `
</channel>
</rss>`;

    return xml;
  }
}
