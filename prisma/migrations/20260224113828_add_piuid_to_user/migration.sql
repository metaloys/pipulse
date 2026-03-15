-- Add piUid column to User table if it doesn't exist
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "piUid" TEXT;

-- Create unique index for piUid if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "User_piUid_key" ON "User"("piUid");


