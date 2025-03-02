-- CreateTable
CREATE TABLE "PreApprovedPublicKey" (
    "id" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedByApplication" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "PreApprovedPublicKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreApprovedPublicKey_publicKey_key" ON "PreApprovedPublicKey"("publicKey");

-- AddForeignKey
ALTER TABLE "PreApprovedPublicKey" ADD CONSTRAINT "PreApprovedPublicKey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
