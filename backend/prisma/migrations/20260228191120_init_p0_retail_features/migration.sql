-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CartItem_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RetailOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "orderStatus" TEXT NOT NULL DEFAULT 'PROCESSING',
    "shippingAddress" TEXT NOT NULL,
    "customRequests" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RetailOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RetailOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "retailOrderId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "totalPrice" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RetailOrderItem_retailOrderId_fkey" FOREIGN KEY ("retailOrderId") REFERENCES "RetailOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RetailOrderItem_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderShipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "retailOrderId" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "shippedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVisibleToCustomer" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderShipment_retailOrderId_fkey" FOREIGN KEY ("retailOrderId") REFERENCES "RetailOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skuId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductImage_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "length" DECIMAL NOT NULL,
    "width" DECIMAL NOT NULL,
    "height" DECIMAL NOT NULL,
    "weight" DECIMAL NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_SkuToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_SkuToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Sku" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SkuToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNo" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inquiryId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'STANDARD',
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "totalAmount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "incoterms" TEXT,
    "shippingMarks" TEXT,
    "portOfLoading" TEXT,
    "portOfDestination" TEXT,
    "consigneeName" TEXT,
    "consigneePhone" TEXT,
    "consigneeCountry" TEXT,
    "consigneeState" TEXT,
    "consigneeCity" TEXT,
    "consigneePostalCode" TEXT,
    "consigneeAddress1" TEXT,
    "consigneeAddress2" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("companyId", "createdAt", "currency", "id", "incoterms", "inquiryId", "orderNo", "portOfDestination", "portOfLoading", "shippingMarks", "status", "totalAmount", "updatedAt", "userId") SELECT "companyId", "createdAt", "currency", "id", "incoterms", "inquiryId", "orderNo", "portOfDestination", "portOfLoading", "shippingMarks", "status", "totalAmount", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");
CREATE UNIQUE INDEX "Order_inquiryId_key" ON "Order"("inquiryId");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT NOT NULL,
    "images360" TEXT,
    "basePrice" DECIMAL NOT NULL,
    "specsTemplate" TEXT NOT NULL,
    "hsCode" TEXT,
    "material" TEXT,
    "vendor" TEXT,
    "productType" TEXT,
    "collection" TEXT,
    "tags" TEXT,
    "weight" DECIMAL,
    "packageId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sizeChartId" TEXT,
    "sizeChartImage" TEXT,
    "materialDetail" TEXT,
    "originCountry" TEXT NOT NULL DEFAULT 'China',
    "loadingPort" TEXT NOT NULL DEFAULT 'Xiamen',
    "season" TEXT,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "fakeSoldCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_sizeChartId_fkey" FOREIGN KEY ("sizeChartId") REFERENCES "SizeChart" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("basePrice", "categoryId", "createdAt", "description", "hsCode", "id", "images", "images360", "isPublished", "loadingPort", "material", "materialDetail", "originCountry", "season", "sizeChartId", "specsTemplate", "title", "updatedAt") SELECT "basePrice", "categoryId", "createdAt", "description", "hsCode", "id", "images", "images360", "isPublished", "loadingPort", "material", "materialDetail", "originCountry", "season", "sizeChartId", "specsTemplate", "title", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE TABLE "new_Sku" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "skuCode" TEXT NOT NULL,
    "barcode" TEXT,
    "allowBackorder" BOOLEAN NOT NULL DEFAULT false,
    "specs" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "moq" INTEGER NOT NULL DEFAULT 1,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "leadTime" TEXT,
    "tierPrices" TEXT,
    "netWeight" DECIMAL,
    "grossWeight" DECIMAL,
    "length" DECIMAL,
    "width" DECIMAL,
    "height" DECIMAL,
    "itemsPerCarton" INTEGER,
    "cartonLength" DECIMAL,
    "cartonWidth" DECIMAL,
    "cartonHeight" DECIMAL,
    "cartonGrossWeight" DECIMAL,
    "retailPrice" REAL,
    "wholesalePrices" TEXT,
    "allowDirectBuy" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sku_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sku" ("cartonGrossWeight", "cartonHeight", "cartonLength", "cartonWidth", "createdAt", "grossWeight", "height", "id", "image", "itemsPerCarton", "leadTime", "length", "moq", "netWeight", "price", "productId", "skuCode", "specs", "stock", "tierPrices", "updatedAt", "width") SELECT "cartonGrossWeight", "cartonHeight", "cartonLength", "cartonWidth", "createdAt", "grossWeight", "height", "id", "image", "itemsPerCarton", "leadTime", "length", "moq", "netWeight", "price", "productId", "skuCode", "specs", "stock", "tierPrices", "updatedAt", "width" FROM "Sku";
DROP TABLE "Sku";
ALTER TABLE "new_Sku" RENAME TO "Sku";
CREATE UNIQUE INDEX "Sku_skuCode_key" ON "Sku"("skuCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_skuId_key" ON "CartItem"("cartId", "skuId");

-- CreateIndex
CREATE UNIQUE INDEX "RetailOrder_orderNo_key" ON "RetailOrder"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_SkuToTag_AB_unique" ON "_SkuToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_SkuToTag_B_index" ON "_SkuToTag"("B");
