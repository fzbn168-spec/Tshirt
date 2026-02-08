-- B2B 鞋服独立站 Mock 测试数据
-- 包含：多级分类、多语言商品 (SPU)、复杂规格变体 (SKU)

-- 清理旧数据 (可选)
TRUNCATE TABLE "Sku", "Product", "Category" RESTART IDENTITY CASCADE;

-- ==========================================
-- 1. 插入分类 (Categories)
-- ==========================================

-- 顶级分类：男鞋 (Men's Shoes)
WITH men_shoes AS (
    INSERT INTO "Category" ("id", "slug", "name", "parentId", "updatedAt")
    VALUES (
        gen_random_uuid(), 
        'men-shoes', 
        '{"en": "Men''s Shoes", "zh": "男鞋", "es": "Zapatos de hombre"}'::jsonb, 
        NULL,
        CURRENT_TIMESTAMP
    )
    RETURNING "id"
),
-- 二级分类：登山靴 (Hiking Boots) - 隶属于男鞋
hiking_boots AS (
    INSERT INTO "Category" ("id", "slug", "name", "parentId", "updatedAt")
    SELECT 
        gen_random_uuid(), 
        'hiking-boots', 
        '{"en": "Hiking Boots", "zh": "登山靴", "es": "Botas de senderismo"}'::jsonb, 
        men_shoes."id",
        CURRENT_TIMESTAMP
    FROM men_shoes
    RETURNING "id"
)

-- ==========================================
-- 2. 插入商品 SPU (Product)
-- ==========================================
INSERT INTO "Product" ("id", "categoryId", "title", "description", "images", "basePrice", "specsTemplate", "isPublished", "updatedAt")
SELECT 
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- 固定 UUID 方便后续引用
    hiking_boots."id",
    -- 多语言标题
    '{"en": "Professional Waterproof Hiking Boots 2024", "zh": "2024新款专业防水登山靴", "es": "Botas de senderismo impermeables 2024"}'::jsonb,
    -- 多语言描述 (富文本结构)
    '{"en": "<p>High durability rubber sole...</p>", "zh": "<p>高耐磨橡胶大底...</p>"}'::jsonb,
    -- 图片数组
    ARRAY['https://example.com/boots-main.jpg', 'https://example.com/boots-detail.jpg'],
    -- 基础参考价
    45.00,
    -- 规格模板 (定义该商品有哪些规格维度)
    '{"colors": ["Red", "Army Green", "Black"], "sizes": ["40", "41", "42", "43", "44", "45"]}'::jsonb,
    true, -- 已发布
    CURRENT_TIMESTAMP
FROM hiking_boots;

-- ==========================================
-- 3. 插入 SKU 变体 (SKUs)
-- ==========================================
-- 这是一个 3颜色 x 3尺码 的部分矩阵示例

INSERT INTO "Sku" ("productId", "skuCode", "specs", "price", "moq", "stock", "updatedAt")
VALUES 
-- 红色系列 (Red)
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'HB-RED-40',
    '{"color": "Red", "size": "40"}'::jsonb,
    45.00, -- 单价
    10,    -- MOQ 10双起订
    500,   -- 库存
    CURRENT_TIMESTAMP
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'HB-RED-41',
    '{"color": "Red", "size": "41"}'::jsonb,
    45.00,
    10,
    480,
    CURRENT_TIMESTAMP
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'HB-RED-42',
    '{"color": "Red", "size": "42"}'::jsonb,
    45.00,
    10,
    600,
    CURRENT_TIMESTAMP
),

-- 军绿色系列 (Army Green) - 比如大码稍微贵一点，或者MOQ要求更高
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'HB-GRN-44',
    '{"color": "Army Green", "size": "44"}'::jsonb,
    48.00, -- 大码贵 $3
    20,    -- MOQ 20双起订
    200,
    CURRENT_TIMESTAMP
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'HB-GRN-45',
    '{"color": "Army Green", "size": "45"}'::jsonb,
    48.00,
    20,
    150,
    CURRENT_TIMESTAMP
);
