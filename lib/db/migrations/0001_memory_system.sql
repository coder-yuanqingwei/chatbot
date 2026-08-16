CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "Memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
	"chatId" uuid REFERENCES "Chat"("id") ON DELETE CASCADE,
	"content" text NOT NULL,
	"summary" text NOT NULL,
	"embedding" vector(1536),
	"category" varchar(64),
	"importance" integer NOT NULL DEFAULT 1,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "Memory_userId_idx" ON "Memory" ("userId");
CREATE INDEX IF NOT EXISTS "Memory_embedding_idx" ON "Memory" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
