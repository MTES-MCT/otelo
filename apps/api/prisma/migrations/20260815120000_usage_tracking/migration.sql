-- CreateTable
CREATE TABLE "login_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "provider" TEXT,
    "user_type" "UserType",
    "region" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_events_session_id_key" ON "login_events"("session_id");

-- CreateIndex
CREATE INDEX "login_events_started_at_idx" ON "login_events"("started_at");

-- CreateIndex
CREATE INDEX "login_events_user_id_started_at_idx" ON "login_events"("user_id", "started_at");

-- AddForeignKey
ALTER TABLE "login_events" ADD CONSTRAINT "login_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "simulation_share_links" ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_viewed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "exports" ADD COLUMN     "document_type" TEXT,
ADD COLUMN     "next_step" TEXT,
ADD COLUMN     "period_start" INTEGER,
ADD COLUMN     "period_end" INTEGER;

-- CreateIndex
CREATE INDEX "exports_created_at_idx" ON "exports"("created_at");
