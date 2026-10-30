import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { connectMongoDB, initPgVector, ensureUploadDir } from './config/database';
import app from './app';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);

// Process-level safety net: Catch unhandled rejections and exceptions so Node never silently terminates with code 1
process.on('unhandledRejection', (reason: any, promise) => {
  console.error('⚠️ Unhandled Promise Rejection (auto-caught):', reason?.message || reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('⚠️ Uncaught Exception (auto-caught):', err?.message || err);
});

async function bootstrap() {
  try {
    // 1. Initialize storage directory safely
    try {
      ensureUploadDir();
    } catch (dirErr: any) {
      console.warn('⚠️ Could not initialize local upload directory:', dirErr.message);
    }

    // 2. Start HTTP server IMMEDIATELY so Render / Docker health checks succeed
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 MedSynexa Backend running on http://0.0.0.0:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      
      const hasOpenRouter = !!process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here';
      const llmText = hasOpenRouter 
        ? `OpenRouter (${process.env.OPENROUTER_CHAT_MODEL || 'google/gemini-2.5-flash'})` 
        : `Gemini (${process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash'})`;
      const embeddingText = hasOpenRouter 
        ? `OpenRouter (${process.env.OPENROUTER_EMBEDDING_MODEL || 'nvidia/nemotron-3-embed-1b:free'}) (2048-dim)` 
        : `Gemini (${process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004'}) (768-dim)`;

      console.log(`   LLM Provider: ${llmText}`);
      console.log(`   Embedding: ${embeddingText}`);
      console.log(`   Vector DB: PostgreSQL + pgvector\n`);
    });

    // 3. Connect databases in background (non-blocking so slow cloud wake-ups don't crash Render)
    Promise.allSettled([
      connectMongoDB(),
      initPgVector(),
    ]).then((results) => {
      const [mongoRes, pgRes] = results;
      if (mongoRes.status === 'fulfilled') {
        console.log('📡 [Boot] MongoDB initialized');
      } else {
        console.warn('⚠️ [Boot] MongoDB init warning:', mongoRes.reason?.message);
      }
      if (pgRes.status === 'fulfilled') {
        console.log('📡 [Boot] pgvector initialized');
      } else {
        console.warn('⚠️ [Boot] pgvector init warning:', pgRes.reason?.message);
      }
    });

    // 4. Handle graceful termination signals from Render / cloud providers
    const handleShutdown = (signal: string) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down MedSynexa server...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
      // Force exit after 10s if connections linger
      setTimeout(() => process.exit(0), 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error: any) {
    console.error('❌ Server bootstrap critical error:', error?.message || error);
    // Don't hard-exit unless it's impossible to run
  }
}

bootstrap();

