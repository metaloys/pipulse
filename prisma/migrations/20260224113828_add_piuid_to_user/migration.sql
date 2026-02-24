/*
  Warnings:

  - Added the required column `piUid` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "piUid" TEXT NOT NULL,
    "piUsername" TEXT NOT NULL,
    "piWallet" TEXT,
    "userRole" TEXT NOT NULL DEFAULT 'WORKER',
    "level" TEXT NOT NULL DEFAULT 'NEWCOMER',
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalEarnings" DECIMAL NOT NULL DEFAULT 0,
    "totalTasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_User" ("createdAt", "currentStreak", "deletedAt", "id", "lastActiveDate", "level", "longestStreak", "piUsername", "piWallet", "status", "totalEarnings", "totalTasksCompleted", "updatedAt", "userRole") SELECT "createdAt", "currentStreak", "deletedAt", "id", "lastActiveDate", "level", "longestStreak", "piUsername", "piWallet", "status", "totalEarnings", "totalTasksCompleted", "updatedAt", "userRole" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_piUid_key" ON "User"("piUid");
CREATE UNIQUE INDEX "User_piUsername_key" ON "User"("piUsername");
CREATE UNIQUE INDEX "User_piWallet_key" ON "User"("piWallet");
CREATE INDEX "User_userRole_idx" ON "User"("userRole");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_piUsername_idx" ON "User"("piUsername");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
