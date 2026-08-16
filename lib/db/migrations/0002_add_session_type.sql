-- Add sessionType column to Chat table
ALTER TABLE "Chat" ADD COLUMN "sessionType" varchar(20) NOT NULL DEFAULT 'chat';
