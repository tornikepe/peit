-- Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column (nullable — existing rows backfill via "Rebuild AI Index" later)
ALTER TABLE "knowledge_chunks" ADD COLUMN "embedding" vector(1024);

-- HNSW index for fast cosine-similarity retrieval (PG14+ with pgvector ≥ 0.5)
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
  ON "knowledge_chunks"
  USING hnsw (embedding vector_cosine_ops);
