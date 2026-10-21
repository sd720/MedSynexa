import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import authRoutes from './routes/authRoutes';
import documentRoutes from './routes/documentRoutes';
import chatRoutes from './routes/chatRoutes';
import opdRoutes from './routes/opdRoutes';
import xrayRoutes from './routes/xrayRoutes';
import drugRoutes from './routes/drugRoutes';
import patientRoutes from './routes/patientRoutes';
import safetyRoutes from './routes/safetyRoutes';

const app = express();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

// CORS configuration supporting Next.js frontend on 3000 / 3001
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl) or matching dev ports
      if (!origin || origin.includes('localhost') || origin === frontendUrl) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static uploaded files locally (e.g. /uploads/...)
const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

import { dbStatus } from './config/database';

// Root and Health Check endpoints for Render / container uptime checkers
const getHealthPayload = () => ({
  status: 'OK',
  service: 'MedSynexa Clinical AI Backend',
  timestamp: new Date(),
  databases: {
    mongodb: dbStatus.mongo,
    postgres: dbStatus.postgres,
    ...(dbStatus.mongoError ? { mongoError: dbStatus.mongoError } : {}),
    ...(dbStatus.postgresError ? { postgresError: dbStatus.postgresError } : {}),
  },
  llm: process.env.OPENROUTER_CHAT_MODEL || process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash',
  vectorDb: 'PostgreSQL + pgvector',
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).json(getHealthPayload());
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json(getHealthPayload());
});

import speechRoutes from './routes/speechRoutes';
import clinicalRoutes from './routes/clinicalRoutes';

// Router mounts
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/opd', opdRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/xray', xrayRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/safety', safetyRoutes);

// Global 404 Route handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Resource not found: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

export default app;
