import mongoose from 'mongoose';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

import dns from 'dns';

// ─── Connection Status Tracking ──────────────────────────────────────────────
export const dbStatus = {
  mongo: 'disconnected',
  postgres: 'disconnected',
  mongoError: null as string | null,
  postgresError: null as string | null,
};

// ─── MongoDB Connection ───────────────────────────────────────────────────────
export const connectMongoDB = async (): Promise<void> => {
  // Safe DNS override: Only attempt on Windows or when explicitly needed to avoid breaking container resolvers
  try {
    if (process.platform === 'win32' && dns.setServers) {
      dns.setServers(['8.8.8.8', '8.8.4.4']);
    }
  } catch (e: any) {
    console.warn('⚠️ Note: Custom DNS server override skipped:', e.message);
  }

  // Prevent duplicate listeners
  mongoose.connection.removeAllListeners('error');
  mongoose.connection.removeAllListeners('disconnected');
  mongoose.connection.removeAllListeners('connected');

  mongoose.connection.on('connected', () => {
    dbStatus.mongo = 'connected';
    dbStatus.mongoError = null;
    console.log('✅ MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    dbStatus.mongo = 'error';
    dbStatus.mongoError = err.message;
    console.error('⚠️ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    dbStatus.mongo = 'disconnected';
    console.warn('⚠️ MongoDB disconnected.');
  });

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medsynexa_db';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    dbStatus.mongo = 'connected';
    console.log('✅ MongoDB connected:', uri.replace(/:([^:@]{3})[^:@]*@/, ':***@'));
  } catch (err: any) {
    dbStatus.mongo = 'error';
    dbStatus.mongoError = err.message;
    console.error('⚠️ Initial MongoDB connection failed:', err.message);
    // Non-fatal: Retry in background every 10 seconds
    setTimeout(async () => {
      try {
        console.log('🔄 Retrying MongoDB connection in background...');
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 15000,
          connectTimeoutMS: 15000,
        });
      } catch (retryErr: any) {
        console.error('⚠️ MongoDB background retry failed:', retryErr.message);
      }
    }, 10000);
  }
};

// ─── PostgreSQL Pool (pgvector) ───────────────────────────────────────────────
let pgPool: Pool | null = null;

export const getPgPool = (): Pool => {
  if (!pgPool) {
    const rawUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medsynexa';
    const isCloudDb = !rawUrl.includes('localhost') && !rawUrl.includes('127.0.0.1');

    pgPool = new Pool({
      connectionString: rawUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
      ssl: isCloudDb ? { rejectUnauthorized: false } : undefined,
    });

    // CRITICAL: Handle idle client errors so unexpected connection drops don't crash Node!
    pgPool.on('error', (err) => {
      console.warn('⚠️ PostgreSQL idle pool client error (auto-handled):', err.message);
      dbStatus.postgresError = err.message;
    });
  }
  return pgPool;
};

/**
 * Initialize the pgvector extension and the embeddings table.
 * Runs once at server startup, with non-fatal error handling.
 */
export const initPgVector = async (): Promise<void> => {
  let client: any = null;
  try {
    const pool = getPgPool();
    client = await pool.connect();
    dbStatus.postgres = 'connected';
    dbStatus.postgresError = null;

    // Enable pgvector extension
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    } catch (extErr: any) {
      console.warn('⚠️ Could not run CREATE EXTENSION vector (might already exist or restricted permission):', extErr.message);
    }

    // Check if the table exists and verify its vector dimension
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'document_embeddings'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      const dimResult = await client.query(`
        SELECT atttypmod 
        FROM pg_attribute 
        WHERE attrelid = 'document_embeddings'::regclass 
          AND attname = 'embedding';
      `);
      if (dimResult.rows.length > 0) {
        const currentDim = dimResult.rows[0].atttypmod;
        if (currentDim !== 2048) {
          console.log(`ℹ️ Mismatched vector dimension (${currentDim}) detected. Re-creating table for 2048 dimensions.`);
          await client.query('DROP TABLE IF EXISTS document_embeddings CASCADE;');
        }
      }
    }

    // Create the main embeddings table
    // nvidia/nemotron-3-embed-1b:free produces 2048-dimensional vectors
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_embeddings (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id TEXT NOT NULL,
        user_id     TEXT NOT NULL,
        filename    TEXT NOT NULL,
        document_type TEXT NOT NULL DEFAULT 'general',
        chunk_index INTEGER NOT NULL,
        content     TEXT NOT NULL,
        embedding   vector(2048) NOT NULL,
        metadata    JSONB DEFAULT '{}',
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create indexes for fast retrieval
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_doc_embeddings_document_id
        ON document_embeddings(document_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_doc_embeddings_user_id
        ON document_embeddings(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_doc_embeddings_type
        ON document_embeddings(document_type);
    `);

    // Drop IVFFlat index if it exists
    await client.query(`
      DROP INDEX IF EXISTS idx_doc_embeddings_vector;
    `);

    console.log('ℹ️  Using Exact Nearest Neighbor search (2048 dimensions exceeds pgvector index limit).');
    console.log('✅ PostgreSQL + pgvector initialized successfully');
  } catch (err: any) {
    dbStatus.postgres = 'error';
    dbStatus.postgresError = err.message;
    console.warn('⚠️ PostgreSQL / pgvector initialization warning (server will still run):', err.message);
  } finally {
    if (client) {
      try {
        client.release();
      } catch (relErr: any) {
        // ignore release error
      }
    }
  }
};

// ─── Upload Directory Setup ───────────────────────────────────────────────────
export const ensureUploadDir = (): string => {
  const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Upload directory created:', uploadDir);
  }
  return uploadDir;
};
