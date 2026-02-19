-- AlterTable
ALTER TABLE "epci_groups" ADD COLUMN     "api_consumer_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "scenarios" ADD COLUMN     "api_consumer_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "simulations" ADD COLUMN     "api_consumer_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "api_consumers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashed_key" TEXT NOT NULL,
    "encrypted_key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "api_consumers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_consumers_hashed_key_key" ON "api_consumers"("hashed_key");

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_api_consumer_id_fkey" FOREIGN KEY ("api_consumer_id") REFERENCES "api_consumers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_api_consumer_id_fkey" FOREIGN KEY ("api_consumer_id") REFERENCES "api_consumers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epci_groups" ADD CONSTRAINT "epci_groups_api_consumer_id_fkey" FOREIGN KEY ("api_consumer_id") REFERENCES "api_consumers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
