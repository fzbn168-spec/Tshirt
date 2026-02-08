-- B2B 鞋服独立站数据库设计 (PostgreSQL)
-- 核心设计思路：
-- 1. 采用 UUID 作为主键，提高安全性和数据迁移便利性
-- 2. 广泛使用 JSONB 存储多语言内容 (title, description) 和 非结构化属性 (specs)
-- 3. 分离 SPU (Product) 和 SKU (ProductVariant) 以支持鞋服复杂变体

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 商品分类表 (Categories)
CREATE TABLE "Category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,          -- URL 友好的标识符 (如: men-shoes)
    "name" JSONB NOT NULL,         -- 多语言名称: {"en": "Men Shoes", "zh": "男鞋"}
    "parentId" UUID,               -- 支持无限级分类
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. 商品主表 (Products / SPU)
CREATE TABLE "Product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "categoryId" UUID NOT NULL,
    
    -- 基础信息 (多语言)
    "title" JSONB NOT NULL,        -- {"en": "Hiking Boots", "zh": "登山靴"}
    "description" JSONB NOT NULL,  -- 富文本描述 JSON 结构
    
    -- 媒体资源
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[], -- 主图 + 轮播图 URL 数组
    
    -- 价格与属性
    "basePrice" DECIMAL(65, 30) NOT NULL,    -- 基础参考价
    "specsTemplate" JSONB NOT NULL,          -- 规格模板: {"colors": ["Red", "Blue"], "sizes": ["40", "41"]}
    
    -- 状态
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. 商品规格变体表 (SKUs)
CREATE TABLE "Sku" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "skuCode" TEXT NOT NULL,       -- 商家编码 (如: HB-RED-40)
    
    -- 核心规格
    "specs" JSONB NOT NULL,        -- 具体规格值: {"color": "Red", "size": "40"}
    
    -- B2B 特有交易属性
    "price" DECIMAL(65, 30) NOT NULL,    -- 该规格的具体批发价
    "moq" INTEGER NOT NULL DEFAULT 1,    -- 最小起订量 (Minimum Order Quantity)
    "stock" INTEGER NOT NULL DEFAULT 0,  -- 库存数量
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Sku_skuCode_key" ON "Sku"("skuCode");
ALTER TABLE "Sku" ADD CONSTRAINT "Sku_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
