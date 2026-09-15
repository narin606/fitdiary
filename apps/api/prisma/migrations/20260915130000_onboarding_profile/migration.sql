-- Onboarding profile. These columns let a new account finish setup before using the app:
-- "targetWeightKg" is the goal weight the wizard collects, and "onboardedAt" records that
-- the setup flow was completed so the app can send an unfinished account back to it.
-- Both are additive and nullable, so existing accounts are unaffected.

ALTER TABLE "User" ADD COLUMN "targetWeightKg" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN "onboardedAt" TIMESTAMP(3);
