-- Add millesime column with default '2021' (auto-fills all existing rows)
ALTER TABLE "rp" ADD COLUMN "millesime" TEXT NOT NULL DEFAULT '2021';

-- Drop old primary key
ALTER TABLE "rp" DROP CONSTRAINT "rp_pkey";

-- Create new primary key including millesime
ALTER TABLE "rp" ADD CONSTRAINT "rp_pkey" PRIMARY KEY ("epci_code", "year", "millesime");

-- Index for millesime queries
CREATE INDEX "rp_millesime_idx" ON "rp"("millesime");
