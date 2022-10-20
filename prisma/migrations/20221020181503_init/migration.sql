-- CreateTable
CREATE TABLE "batches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ref" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "purchased_quantity" INTEGER NOT NULL,
    "eta" DATETIME
);

-- CreateTable
CREATE TABLE "order_lines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order_ref" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderline_id" INTEGER NOT NULL,
    "batch_id" INTEGER NOT NULL,
    CONSTRAINT "allocations_orderline_id_fkey" FOREIGN KEY ("orderline_id") REFERENCES "order_lines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "allocations_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "batches_ref_key" ON "batches"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "allocations_orderline_id_key" ON "allocations"("orderline_id");

-- CreateIndex
CREATE UNIQUE INDEX "allocations_batch_id_key" ON "allocations"("batch_id");
