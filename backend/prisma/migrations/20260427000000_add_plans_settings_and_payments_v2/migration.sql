-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MERCADOPAGO', 'PAYPAL');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "CouponScope" AS ENUM ('ALL', 'COURSES', 'PLANS', 'CATEGORIES');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('PDF', 'DOC', 'SHEET', 'PPT', 'IMAGE', 'AUDIO', 'ARCHIVE', 'OTHER');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "comparePrice" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "comparePrice" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "discountAmount" DECIMAL(10,2),
ADD COLUMN     "paypalOrderId" TEXT,
ADD COLUMN     "provider" "PaymentProvider" NOT NULL DEFAULT 'MERCADOPAGO',
ALTER COLUMN "currency" SET DEFAULT 'USD';

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "paypalSubscriptionId" TEXT,
ADD COLUMN     "provider" "PaymentProvider" NOT NULL DEFAULT 'MERCADOPAGO';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "country" TEXT;

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL DEFAULT 'OTHER',
    "sizeBytes" BIGINT NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "moduleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "key" "PaymentType" NOT NULL,
    "label" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "comparePrice" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "badge" TEXT,
    "savings" TEXT,
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "scope" "CouponScope" NOT NULL DEFAULT 'ALL',
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "plansPromoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "plansPromoEndsAt" TIMESTAMP(3),
    "promoRibbonEnabled" BOOLEAN NOT NULL DEFAULT false,
    "promoRibbonText" TEXT NOT NULL DEFAULT 'Oferta por tiempo limitado',
    "promoRibbonSecondaryText" TEXT,
    "promoRibbonShowCountdown" BOOLEAN NOT NULL DEFAULT false,
    "promoRibbonCtaText" TEXT DEFAULT 'Ver planes',
    "promoRibbonCtaUrl" TEXT DEFAULT '/#pricing',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resources_moduleId_idx" ON "resources"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "plans_key_key" ON "plans"("key");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paypalOrderId_key" ON "payments"("paypalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_paypalSubscriptionId_key" ON "subscriptions"("paypalSubscriptionId");

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

