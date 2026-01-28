-- CreateTable
CREATE TABLE "users_whitelist" (
    "email" TEXT NOT NULL,

    CONSTRAINT "users_whitelist_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_whitelist_email_key" ON "users_whitelist"("email");
