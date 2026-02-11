import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
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
          Size 
        } = row as any;

        if (!Title || !BasePrice || !CategorySlug) {
          throw new Error('Missing required fields: Title, BasePrice, CategorySlug');
        }

        // 1. Find or Create Category
        const category = await this.prisma.category.findUnique({
          where: { slug: CategorySlug }
        });

        if (!category) {
          throw new Error(`Category not found: ${CategorySlug}`);
        }

        // 2. Find or Create Product (by Title)
        // Note: This assumes unique titles for simplicity in import
        let product = await this.prisma.product.findFirst({
          where: { 
            title: { contains: Title } // Simple check, ideally strict match
          }
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
            }
          });
        }

        // 3. Create SKU if SKUCode provided
        if (SKUCode) {
          const specs: any = {};
          if (Color) specs.color = Color;
          if (Size) specs.size = Size;

          const existingSku = await this.prisma.sku.findUnique({
            where: { skuCode: String(SKUCode) }
          });

          if (!existingSku) {
            await this.prisma.sku.create({
              data: {
                productId: product.id,
                skuCode: String(SKUCode),
                price: Number(BasePrice), // Default to base price
                moq: Number(MOQ) || 1,
                specs: JSON.stringify(specs),
                stock: 100, // Default stock
              }
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
      doc.fontSize(10).text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // List
      products.forEach((product, index) => {
         // Avoid page break inside item if possible, or just let it flow
         if (doc.y > 700) doc.addPage();

         const title = JSON.parse(product.title).en || 'Product';
         doc.fontSize(14).font('Helvetica-Bold').text(title);
         doc.fontSize(10).font('Helvetica').text(`Category: ${product.category?.name ? (JSON.parse(product.category.name).en || '-') : '-'}`);
         doc.text(`Price: From $${Number(product.basePrice).toFixed(2)}`);
         doc.text(`MOQ: ${product.skus[0]?.moq || 1}`);
         doc.moveDown(0.5);
         
         const desc = JSON.parse(product.description).en || '';
         doc.fontSize(9).text(desc.substring(0, 200) + (desc.length > 200 ? '...' : ''), {
             width: 500,
             align: 'justify'
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
                include: { values: true }
              }
            },
          },
          category: true,
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
    attributes?: Record<string, string[]>; // { attrId: [valId1, valId2] }
    skip?: number;
    take?: number;
  }) {
    const { search, categoryId, minPrice, maxPrice, attributes, skip, take } = params || {};
    
    const where: any = {};

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
       const attributeConditions = Object.entries(attributes).map(([attrId, valueIds]) => ({
        attributeValues: {
          some: {
            attributeValueId: { in: valueIds }
          }
        }
      }));

      // Ensure at least one SKU matches ALL attribute conditions
      where.skus = {
        some: {
          AND: attributeConditions
        }
      };
    }

    const total = await this.prisma.product.count({ where });
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
              include: { values: true }
            }
          },
        },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    return { total, items };
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
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
              include: { values: true }
            }
          },
        },
        category: true,
      },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { skus, attributeIds, ...productData } = updateProductDto;

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
      if (Object.keys(productData).length > 0 || attributeIds) {
        await this.prisma.$transaction(async (tx) => {
           // 1. Update basic fields
           if (Object.keys(productData).length > 0) {
              await tx.product.update({
                where: { id },
                data: productData,
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
                 data: attributeIds.map(aid => ({
                   productId: id,
                   attributeId: aid
                 }))
               });
             }
           }
        });
      }
    } catch (error) {
       console.error("Update Product Error:", error);
       throw error;
    }


    // Handle SKU updates if provided (Replace strategy)
    if (skus) {
      try {
        /**
          * ⚠️ 高风险操作：SKU 替换 ⚠️
          * 
          * 我们将删除该商品的所有现有 SKU 并重新创建它们。
          * 
          * 风险：
          * 1. 外键约束：如果现有订单引用了这些 SKU ID，这将失败
          *    除非设置了级联删除（这对订单来说很危险）。
          * 2. 历史丢失：如果 ID 发生变化，历史订单数据可能会丢失与 SKU 的链接。
          * 
          * TODO: 实现“差异对比 (Diffing)”策略：
          * - 按 ID 更新现有 SKU
          * - 创建新 SKU
          * - 仅删除已移除的 SKU（检查使用情况后）
          */
         await this.prisma.$transaction(async (tx) => {
          await tx.sku.deleteMany({ where: { productId: id } });
          
          for (const sku of skus) {
            const { attributeValueIds, ...skuData } = sku;
            await tx.sku.create({
              data: {
                ...skuData,
                productId: id,
                attributeValues: attributeValueIds
                  ? {
                      create: attributeValueIds.map((aid) => ({
                        attributeValueId: aid,
                      })),
                    }
                  : undefined,
              },
            });
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
}
