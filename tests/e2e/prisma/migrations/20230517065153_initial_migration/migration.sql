-- CreateTable
CREATE TABLE "Room" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "storage" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");
