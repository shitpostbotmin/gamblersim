/*
  Warnings:

  - You are about to drop the column `fromUserId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `toUserId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `discordGuildId` on the `User` table. All the data in the column will be lost.
  - Added the required column `description` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `money` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `worldId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "World" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discordGuildId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "worldId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "image" TEXT,
    CONSTRAINT "Item_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "money" INTEGER NOT NULL,
    "itemId" INTEGER,
    CONSTRAINT "Transaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("id") SELECT "id" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "worldId" INTEGER NOT NULL,
    "discordUserId" TEXT NOT NULL,
    CONSTRAINT "User_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("discordUserId", "id") SELECT "discordUserId", "id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
