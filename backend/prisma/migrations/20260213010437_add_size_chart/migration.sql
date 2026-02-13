-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN "incoterms" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "incoterms" TEXT;
ALTER TABLE "Order" ADD COLUMN "portOfDestination" TEXT;
ALTER TABLE "Order" ADD COLUMN "portOfLoading" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingMarks" TEXT;

-- AlterTable
ALTER TABLE "Sku" ADD COLUMN "grossWeight" DECIMAL;
ALTER TABLE "Sku" ADD COLUMN "height" DECIMAL;
ALTER TABLE "Sku" ADD COLUMN "itemsPerCarton" INTEGER;
ALTER TABLE "Sku" ADD COLUMN "length" DECIMAL;
ALTER TABLE "Sku" ADD COLUMN "netWeight" DECIMAL;
ALTER TABLE "Sku" ADD COLUMN "width" DECIMAL;

-- CreateTable
CREATE TABLE "SizeChart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sizeChartId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_sizeChartId_fkey" FOREIGN KEY ("sizeChartId") REFERENCES "SizeChart" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("basePrice", "categoryId", "createdAt", "description", "id", "images", "images360", "isPublished", "specsTemplate", "title", "updatedAt") SELECT "basePrice", "categoryId", "createdAt", "description", "id", "images", "images360", "isPublished", "specsTemplate", "title", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
