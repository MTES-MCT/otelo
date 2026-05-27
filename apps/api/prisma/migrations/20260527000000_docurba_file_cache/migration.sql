CREATE TABLE "DocurbaFile" (
    "filename" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocurbaFile_pkey" PRIMARY KEY ("filename")
);
