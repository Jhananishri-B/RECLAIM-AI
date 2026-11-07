BEGIN;

ALTER TABLE "Business" ADD COLUMN "businessEmail" VARCHAR(320);
UPDATE "Business"
SET "businessEmail" = CASE WHEN "id" = 'dataset-business' THEN 'dataset-import@reclaim.local' ELSE 'development@reclaim.local' END
WHERE "businessEmail" IS NULL;
ALTER TABLE "Business" ALTER COLUMN "businessEmail" SET NOT NULL;
CREATE INDEX "Business_businessEmail_idx" ON "Business"("businessEmail");

CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

ALTER TABLE "User" ADD COLUMN "name" VARCHAR(200);
ALTER TABLE "User" ADD COLUMN "passwordHash" VARCHAR(255);
UPDATE "User"
SET "name" = COALESCE(NULLIF("displayName", ''), "email"),
    "passwordHash" = '$2b$12$00000000000000000000000000000000000000000000000000000'
WHERE "name" IS NULL OR "passwordHash" IS NULL;
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;
DROP INDEX "User_businessId_email_key";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "BusinessMembership" (
    "id" VARCHAR(100) NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BusinessMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessMembership_userId_businessId_key" ON "BusinessMembership"("userId", "businessId");

INSERT INTO "BusinessMembership" ("id", "userId", "businessId", "role")
SELECT 'legacy-membership-' || "id", "id", "businessId", 'OWNER'::"MembershipRole"
FROM "User"
ON CONFLICT ("userId", "businessId") DO NOTHING;

CREATE TABLE "RefreshSession" (
    "id" VARCHAR(100) NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BusinessMembership_businessId_role_idx" ON "BusinessMembership"("businessId", "role");
CREATE INDEX "BusinessMembership_userId_idx" ON "BusinessMembership"("userId");
CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");
CREATE INDEX "RefreshSession_userId_revokedAt_expiresAt_idx" ON "RefreshSession"("userId", "revokedAt", "expiresAt");

ALTER TABLE "BusinessMembership" ADD CONSTRAINT "BusinessMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessMembership" ADD CONSTRAINT "BusinessMembership_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
