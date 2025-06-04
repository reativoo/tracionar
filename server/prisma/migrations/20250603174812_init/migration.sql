-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "defaultCPA" REAL,
    "favoriteFilters" TEXT,
    "dashboardLayout" TEXT,
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "facebook_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "facebook_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facebookAccountId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT,
    "status" TEXT NOT NULL,
    "desiredCPA" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "campaigns_facebookAccountId_fkey" FOREIGN KEY ("facebookAccountId") REFERENCES "facebook_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ad_sets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "adSetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "targetingType" TEXT,
    "desiredCPA" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ad_sets_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adSetId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "creative" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ads_adSetId_fkey" FOREIGN KEY ("adSetId") REFERENCES "ad_sets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campaign_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "spend" REAL NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "ctr" REAL NOT NULL DEFAULT 0,
    "cpc" REAL NOT NULL DEFAULT 0,
    "cpm" REAL NOT NULL DEFAULT 0,
    "cpa" REAL NOT NULL DEFAULT 0,
    "roas" REAL NOT NULL DEFAULT 0,
    "frequency" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "campaign_metrics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ad_set_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adSetId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "spend" REAL NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "ctr" REAL NOT NULL DEFAULT 0,
    "cpc" REAL NOT NULL DEFAULT 0,
    "cpm" REAL NOT NULL DEFAULT 0,
    "cpa" REAL NOT NULL DEFAULT 0,
    "roas" REAL NOT NULL DEFAULT 0,
    "frequency" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ad_set_metrics_adSetId_fkey" FOREIGN KEY ("adSetId") REFERENCES "ad_sets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ad_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "spend" REAL NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "ctr" REAL NOT NULL DEFAULT 0,
    "cpc" REAL NOT NULL DEFAULT 0,
    "cpm" REAL NOT NULL DEFAULT 0,
    "cpa" REAL NOT NULL DEFAULT 0,
    "roas" REAL NOT NULL DEFAULT 0,
    "frequency" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ad_metrics_adId_fkey" FOREIGN KEY ("adId") REFERENCES "ads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "entityId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "recommendations" TEXT,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsSync" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "facebook_accounts_userId_accountId_key" ON "facebook_accounts"("userId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_facebookAccountId_campaignId_key" ON "campaigns"("facebookAccountId", "campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "ad_sets_campaignId_adSetId_key" ON "ad_sets"("campaignId", "adSetId");

-- CreateIndex
CREATE UNIQUE INDEX "ads_adSetId_adId_key" ON "ads"("adSetId", "adId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_metrics_campaignId_date_key" ON "campaign_metrics"("campaignId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ad_set_metrics_adSetId_date_key" ON "ad_set_metrics"("adSetId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ad_metrics_adId_date_key" ON "ad_metrics"("adId", "date");
