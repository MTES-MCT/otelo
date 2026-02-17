-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('SNOOZED', 'SUBMITTED');

-- CreateTable
CREATE TABLE "user_feedbacks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_feedbacks_user_id_key" ON "user_feedbacks"("user_id");

-- AddForeignKey
ALTER TABLE "user_feedbacks" ADD CONSTRAINT "user_feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
