/*
  Warnings:

  - Added the required column `expiry` to the `OtpRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OtpRecord" ADD COLUMN     "expiry" TIMESTAMP(3) NOT NULL;
