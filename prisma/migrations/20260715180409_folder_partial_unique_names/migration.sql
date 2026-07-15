-- DropIndex
DROP INDEX "folders_userId_idx";

-- DropIndex
DROP INDEX "folders_userId_parentId_name_key";

-- CreateIndex
CREATE INDEX "folders_userId_parentId_idx" ON "folders"("userId", "parentId");

-- Partial unique indexes: a plain unique constraint on (userId, parentId, name)
-- would not stop duplicate root-folder names, since Postgres treats NULL as
-- distinct from NULL. Split into two indexes, one per nullability case.
CREATE UNIQUE INDEX "folders_root_name_key" ON "folders"("userId", "name") WHERE "parentId" IS NULL;
CREATE UNIQUE INDEX "folders_child_name_key" ON "folders"("userId", "parentId", "name") WHERE "parentId" IS NOT NULL;
