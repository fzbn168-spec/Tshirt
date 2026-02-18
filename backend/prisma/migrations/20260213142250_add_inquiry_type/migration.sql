-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inquiryNo" TEXT NOT NULL,
    "companyId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "notes" TEXT,
    "attachments" TEXT,
    "incoterms" TEXT,
    "type" TEXT NOT NULL DEFAULT 'STANDARD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inquiry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Inquiry" ("attachments", "companyId", "contactEmail", "contactName", "createdAt", "id", "incoterms", "inquiryNo", "notes", "status", "updatedAt") SELECT "attachments", "companyId", "contactEmail", "contactName", "createdAt", "id", "incoterms", "inquiryNo", "notes", "status", "updatedAt" FROM "Inquiry";
DROP TABLE "Inquiry";
ALTER TABLE "new_Inquiry" RENAME TO "Inquiry";
CREATE UNIQUE INDEX "Inquiry_inquiryNo_key" ON "Inquiry"("inquiryNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
