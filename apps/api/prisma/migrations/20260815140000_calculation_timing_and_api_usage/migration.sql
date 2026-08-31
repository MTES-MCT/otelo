-- AlterTable
ALTER TABLE "simulation_results_history" ADD COLUMN     "duration_ms" INTEGER,
ADD COLUMN     "nb_epcis" INTEGER;

-- CreateTable
CREATE TABLE "api_consumer_usage_daily" (
    "api_consumer_id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "api_consumer_usage_daily_pkey" PRIMARY KEY ("api_consumer_id","day")
);

-- CreateIndex
CREATE INDEX "api_consumer_usage_daily_day_idx" ON "api_consumer_usage_daily"("day");

-- AddForeignKey
ALTER TABLE "api_consumer_usage_daily" ADD CONSTRAINT "api_consumer_usage_daily_api_consumer_id_fkey" FOREIGN KEY ("api_consumer_id") REFERENCES "api_consumers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
