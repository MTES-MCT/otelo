-- ===================================================================
-- Better Auth Migration
-- Migrates from NextAuth to Better Auth schema
-- NOTE: All existing sessions will be invalidated (users must re-login)
-- ===================================================================

-- =====================
-- Phase 1: Drop Foreign Keys
-- =====================
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_userId_fkey";
ALTER TABLE "email_verifications" DROP CONSTRAINT "email_verifications_user_id_fkey";
ALTER TABLE "impersonation_sessions" DROP CONSTRAINT "impersonation_sessions_admin_user_id_fkey";
ALTER TABLE "impersonation_sessions" DROP CONSTRAINT "impersonation_sessions_target_user_id_fkey";
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_impersonated_user_id_fkey";
ALTER TABLE "user_account_reset_tokens" DROP CONSTRAINT "user_account_reset_tokens_user_id_fkey";

-- =====================
-- Phase 2: Migrate Users table
-- =====================

-- 2a. Add new columns
ALTER TABLE "users" ADD COLUMN "name" TEXT;
ALTER TABLE "users" ADD COLUMN "image" TEXT;

-- 2b. Populate name from existing data
UPDATE "users" SET "name" = CONCAT("firstname", ' ', "lastname");

-- 2c. Make name NOT NULL now that all rows have a value
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;

-- 2d. Convert emailVerified from DateTime? to Boolean in-place (preserves verification status)
--     NULL (not verified) -> false, NOT NULL (verified) -> true
ALTER TABLE "users" ALTER COLUMN "emailVerified" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "emailVerified" TYPE BOOLEAN USING ("emailVerified" IS NOT NULL);
ALTER TABLE "users" ALTER COLUMN "emailVerified" SET DEFAULT false;
ALTER TABLE "users" ALTER COLUMN "emailVerified" SET NOT NULL;

-- =====================
-- Phase 3: Migrate Accounts table
-- =====================

-- 3a. Drop old composite primary key (provider, providerAccountId)
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_pkey";

-- 3b. Add new columns (nullable initially)
ALTER TABLE "accounts" ADD COLUMN "id" TEXT;
ALTER TABLE "accounts" ADD COLUMN "access_token" TEXT;
ALTER TABLE "accounts" ADD COLUMN "access_token_expires_at" TIMESTAMP(3);
ALTER TABLE "accounts" ADD COLUMN "id_token" TEXT;
ALTER TABLE "accounts" ADD COLUMN "password" TEXT;
ALTER TABLE "accounts" ADD COLUMN "refresh_token" TEXT;
ALTER TABLE "accounts" ADD COLUMN "refresh_token_expires_at" TIMESTAMP(3);
ALTER TABLE "accounts" ADD COLUMN "scope" TEXT;

-- 3c. Generate UUIDs for existing account rows
UPDATE "accounts" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;

-- 3d. Make id NOT NULL
ALTER TABLE "accounts" ALTER COLUMN "id" SET NOT NULL;

-- 3e. Rename columns to Better Auth convention
--     provider         -> provider_id
--     providerAccountId -> account_id
--     userId           -> user_id
ALTER TABLE "accounts" RENAME COLUMN "provider" TO "provider_id";
ALTER TABLE "accounts" RENAME COLUMN "providerAccountId" TO "account_id";
ALTER TABLE "accounts" RENAME COLUMN "userId" TO "user_id";

-- 3f. Drop unused column
ALTER TABLE "accounts" DROP COLUMN "type";

-- 3g. Set new primary key
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");

-- 3h. Create credential accounts for users who have a password
--     (NextAuth stored passwords on User, Better Auth stores them on Account)
INSERT INTO "accounts" ("id", "account_id", "provider_id", "user_id", "password", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  u."email",
  'credential',
  u."id",
  u."password",
  u."created_at",
  u."updated_at"
FROM "users" u
WHERE u."password" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM "accounts" a
  WHERE a."user_id" = u."id" AND a."provider_id" = 'credential'
);

-- 3i. Now safe to drop migrated columns from users
ALTER TABLE "users" DROP COLUMN "password";
ALTER TABLE "users" DROP COLUMN "provider";
ALTER TABLE "users" DROP COLUMN "sub";

-- =====================
-- Phase 4: Migrate Sessions table
-- =====================

-- 4a. Truncate sessions (all users must re-login after migration)
TRUNCATE TABLE "sessions";

-- 4b. Drop old columns
ALTER TABLE "sessions" DROP COLUMN "accessToken";
ALTER TABLE "sessions" DROP COLUMN "refreshToken";
ALTER TABLE "sessions" DROP COLUMN "impersonated_user_id";

-- 4c. Add new Better Auth columns (safe after TRUNCATE)
ALTER TABLE "sessions" ADD COLUMN "token" TEXT NOT NULL;
ALTER TABLE "sessions" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "sessions" ADD COLUMN "ip_address" TEXT;
ALTER TABLE "sessions" ADD COLUMN "user_agent" TEXT;
ALTER TABLE "sessions" ADD COLUMN "impersonated_by" TEXT;
ALTER TABLE "sessions" ALTER COLUMN "updated_at" DROP DEFAULT;


-- =====================
-- Phase 5: Drop old tables (replaced by Better Auth's Verification model)
-- =====================
DROP TABLE "email_verifications";
DROP TABLE "impersonation_sessions";
DROP TABLE "user_account_reset_tokens";

-- =====================
-- Phase 6: Create Better Auth Verification table
-- =====================
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- =====================
-- Phase 6b: Add admin plugin fields to users
-- =====================
ALTER TABLE "users" ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "ban_reason" TEXT;

-- =====================
-- Phase 7: Create indexes
-- =====================
CREATE UNIQUE INDEX "accounts_provider_id_account_id_key" ON "accounts"("provider_id", "account_id");
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- =====================
-- Phase 8: Re-add foreign keys
-- =====================
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
