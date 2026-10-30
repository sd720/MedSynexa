import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import zlib from 'zlib';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// Polyfill WebSocket for Node.js environments (required by @supabase/supabase-js on Node < 22)
if (typeof global.WebSocket === 'undefined') {
  (global as any).WebSocket = WebSocket;
}

const BUCKET_NAME = 'documents';

// Lazily initialize Supabase Client to prevent fatal startup crash if env vars are missing
let supabaseClient: any = null;
const getSupabase = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (supabaseUrl && supabaseKey) {
      try {
        supabaseClient = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
          },
        });
      } catch (err: any) {
        console.warn('⚠️ Supabase Storage client init failed, falling back to local disk:', err.message);
      }
    }
  }
  return supabaseClient;
};

/**
 * Compress the temp file and upload it to Supabase Storage, or save locally if Supabase is unconfigured.
 * Returns the storage path.
 */
export const saveUploadedFile = async (
  tempPath: string,
  originalName: string,
  userId: string
): Promise<string> => {
  const ext = path.extname(originalName).toLowerCase();
  const safeName = `${uuidv4()}${ext}`;
  const supabase = getSupabase();

  try {
    // If Supabase is not configured, fallback to storing locally in uploads directory
    if (!supabase) {
      const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const destPath = path.join(uploadDir, `${safeName}.gz`);
      const fileBuffer = fs.readFileSync(tempPath);
      const compressedBuffer = zlib.gzipSync(fileBuffer);
      fs.writeFileSync(destPath, compressedBuffer);
      console.log(`📁 Saved compressed file locally: ${destPath}`);
      return `local:${safeName}.gz`;
    }

    const supabasePath = `${userId}/${safeName}.gz`;
    // Read the uncompressed file
    const fileBuffer = fs.readFileSync(tempPath);

    // Compress using gzip
    console.log(`🗜️ Compressing file before upload...`);
    const compressedBuffer = zlib.gzipSync(fileBuffer);

    // Upload to Supabase Storage
    console.log(`☁️ Uploading compressed file to Supabase Storage: ${supabasePath}`);
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(supabasePath, compressedBuffer, {
        contentType: 'application/gzip',
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    return supabasePath;
  } finally {
    // Delete the local temp file to save disk space
    cleanupTempFile(tempPath);
  }
};

/**
 * Delete a file from Supabase Storage or local disk.
 */
export const deleteUploadedFile = async (supabasePath: string): Promise<void> => {
  try {
    if (supabasePath.startsWith('local:')) {
      const fileName = supabasePath.replace('local:', '');
      const localFile = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads', fileName);
      if (fs.existsSync(localFile)) {
        fs.unlinkSync(localFile);
      }
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    console.log(`🗑️ Deleting file from Supabase Storage: ${supabasePath}`);
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([supabasePath]);
    if (error) {
      console.error('Failed to delete file from Supabase:', error.message);
    }
  } catch (err) {
    console.error('Failed to delete file:', err);
  }
};

/**
 * Get a public URL or Signed URL for a stored file.
 * We'll use a short-lived Signed URL for security.
 */
export const getFileUrl = async (supabasePath: string): Promise<string> => {
  if (supabasePath.startsWith('local:')) {
    const fileName = supabasePath.replace('local:', '');
    return `/uploads/${fileName}`;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return `/uploads/${supabasePath}`;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(supabasePath, 3600); // 1 hour expiry

  if (error || !data) {
    throw new Error('Failed to generate signed URL');
  }
  return data.signedUrl;
};

/**
 * Download the compressed file from Supabase or local disk and decompress it.
 * Returns the uncompressed Buffer.
 */
export const downloadAndDecompressFile = async (supabasePath: string): Promise<Buffer> => {
  if (supabasePath.startsWith('local:')) {
    const fileName = supabasePath.replace('local:', '');
    const localFile = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads', fileName);
    if (!fs.existsSync(localFile)) {
      throw new Error(`Local file not found: ${localFile}`);
    }
    const compressedBuffer = fs.readFileSync(localFile);
    return zlib.gunzipSync(compressedBuffer);
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase Storage is not configured.');
  }

  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(supabasePath);
  
  if (error || !data) {
    throw new Error(`Failed to download file from Supabase: ${error?.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  const compressedBuffer = Buffer.from(arrayBuffer);
  
  // Decompress
  const uncompressedBuffer = zlib.gunzipSync(compressedBuffer);
  return uncompressedBuffer;
};

/**
 * Clean up any temp files that might have been left from failed uploads.
 */
export const cleanupTempFile = (filePath: string): void => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors
  }
};
