/*
  Warnings:

  - You are about to drop the column `email` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the `OrganizerEmail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrganizerPhone` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[contactInfosId]` on the table `Contact` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contactInfosId]` on the table `Organizer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contactInfosId` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactInfosId` to the `Organizer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrganizerEmail" DROP CONSTRAINT "OrganizerEmail_organizerId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizerPhone" DROP CONSTRAINT "OrganizerPhone_organizerId_fkey";

-- DropIndex
DROP INDEX "Contact_bookerId_email_key";

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "email",
DROP COLUMN "phone",
ADD COLUMN     "contactInfosId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "contactInfosId" TEXT NOT NULL;

-- DropTable
DROP TABLE "OrganizerEmail";

-- DropTable
DROP TABLE "OrganizerPhone";

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "contactInfosId" TEXT NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phone" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "contactInfosId" TEXT NOT NULL,

    CONSTRAINT "Phone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInfos" (
    "id" TEXT NOT NULL,
    "website" TEXT,
    "street" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "country" TEXT,

    CONSTRAINT "ContactInfos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contact_contactInfosId_key" ON "Contact"("contactInfosId");

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_contactInfosId_key" ON "Organizer"("contactInfosId");

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_contactInfosId_fkey" FOREIGN KEY ("contactInfosId") REFERENCES "ContactInfos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phone" ADD CONSTRAINT "Phone_contactInfosId_fkey" FOREIGN KEY ("contactInfosId") REFERENCES "ContactInfos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organizer" ADD CONSTRAINT "Organizer_contactInfosId_fkey" FOREIGN KEY ("contactInfosId") REFERENCES "ContactInfos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_contactInfosId_fkey" FOREIGN KEY ("contactInfosId") REFERENCES "ContactInfos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
