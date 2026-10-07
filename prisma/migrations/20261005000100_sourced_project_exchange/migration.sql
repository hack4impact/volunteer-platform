-- CreateEnum
CREATE TYPE "SourcedProjectStatus" AS ENUM ('AVAILABLE', 'CLAIM_PENDING', 'CLAIMED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CauseArea" AS ENUM ('HEALTH', 'EDUCATION', 'FOOD_SECURITY', 'HOUSING', 'ENVIRONMENT', 'ECONOMIC_OPPORTUNITY', 'ARTS_AND_CULTURE', 'CIVIC_ENGAGEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'EXPIRED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('REPO', 'SCOPING_DOC', 'DESIGN_FILE', 'DELIVERABLE', 'OTHER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "chapterId" TEXT;

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sourced_project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "causeArea" "CauseArea" NOT NULL,
    "techContext" TEXT,
    "status" "SourcedProjectStatus" NOT NULL DEFAULT 'AVAILABLE',
    "handoffNotes" TEXT NOT NULL,
    "sourcingChapterId" TEXT NOT NULL,
    "sourcedById" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "withdrawnAt" TIMESTAMP(3),
    "clientOrgName" TEXT NOT NULL,
    "clientContactName" TEXT NOT NULL,
    "clientContactEmail" TEXT NOT NULL,
    "clientContactPhone" TEXT,
    "partnerNotes" TEXT,

    CONSTRAINT "sourced_project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_claim" (
    "id" TEXT NOT NULL,
    "sourcedProjectId" TEXT NOT NULL,
    "claimingChapterId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "project_claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sourced_project_link" (
    "id" TEXT NOT NULL,
    "sourcedProjectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "linkType" "LinkType" NOT NULL DEFAULT 'OTHER',
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sourced_project_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_name_key" ON "Chapter"("name");

-- CreateIndex
CREATE INDEX "sourced_project_status_idx" ON "sourced_project"("status");

-- CreateIndex
CREATE INDEX "sourced_project_sourcingChapterId_idx" ON "sourced_project"("sourcingChapterId");

-- CreateIndex
CREATE INDEX "sourced_project_causeArea_idx" ON "sourced_project"("causeArea");

-- CreateIndex
CREATE INDEX "project_claim_sourcedProjectId_idx" ON "project_claim"("sourcedProjectId");

-- CreateIndex
CREATE INDEX "project_claim_claimingChapterId_idx" ON "project_claim"("claimingChapterId");

-- CreateIndex
CREATE INDEX "project_claim_status_idx" ON "project_claim"("status");

-- CreateIndex
CREATE INDEX "sourced_project_link_sourcedProjectId_idx" ON "sourced_project_link"("sourcedProjectId");

-- CreateIndex
CREATE INDEX "User_chapterId_idx" ON "User"("chapterId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourced_project" ADD CONSTRAINT "sourced_project_sourcingChapterId_fkey" FOREIGN KEY ("sourcingChapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourced_project" ADD CONSTRAINT "sourced_project_sourcedById_fkey" FOREIGN KEY ("sourcedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_claim" ADD CONSTRAINT "project_claim_sourcedProjectId_fkey" FOREIGN KEY ("sourcedProjectId") REFERENCES "sourced_project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_claim" ADD CONSTRAINT "project_claim_claimingChapterId_fkey" FOREIGN KEY ("claimingChapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_claim" ADD CONSTRAINT "project_claim_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_claim" ADD CONSTRAINT "project_claim_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourced_project_link" ADD CONSTRAINT "sourced_project_link_sourcedProjectId_fkey" FOREIGN KEY ("sourcedProjectId") REFERENCES "sourced_project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourced_project_link" ADD CONSTRAINT "sourced_project_link_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- A listing can have at most one active (PENDING or APPROVED) claim.
-- Partial unique index; not expressible in schema.prisma, so it lives only here.
-- Rejected/withdrawn/expired/abandoned claims are unrestricted to keep history.
CREATE UNIQUE INDEX "project_claim_one_active_per_listing" ON "project_claim"("sourcedProjectId") WHERE "status" IN ('PENDING', 'APPROVED');
