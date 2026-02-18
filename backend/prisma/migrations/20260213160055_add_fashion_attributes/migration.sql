-- AlterTable
ALTER TABLE "Sku" ADD COLUMN "cartonGrossWeight" DECIMAL;
ALTER TABLE "Sku" ADD COLUMN "cartonHeight" DECIMAL;
ALTER TABLE "Sku" ADD COLUMN "cartonLength" DECIMAL;
ALTER TABLE "Sku" ADD COLUMN "cartonWidth" DECIMAL;

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
    "materialDetail" TEXT,
    "originCountry" TEXT NOT NULL DEFAULT 'China',
    "loadingPort" TEXT NOT NULL DEFAULT 'Xiamen',
    "season" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_sizeChartId_fkey" FOREIGN KEY ("sizeChartId") REFERENCES "SizeChart" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("basePrice", "categoryId", "createdAt", "description", "hsCode", "id", "images", "images360", "isPublished", "material", "sizeChartId", "specsTemplate", "title", "updatedAt") SELECT "basePrice", "categoryId", "createdAt", "description", "hsCode", "id", "images", "images360", "isPublished", "material", "sizeChartId", "specsTemplate", "title", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
