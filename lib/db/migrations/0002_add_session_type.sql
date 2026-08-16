-- Add sessionType column to Chat table
ALTER TABLE "Chat" ADD COLUMN "sessionType" varchar(4) NOT NULL DEFAULT 'chat';
