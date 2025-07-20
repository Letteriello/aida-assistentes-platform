import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { createAuthRoutes } from './routes/auth.routes';
import { createInstanceRoutes, createWebhookRoutes } from './routes/instances.routes';
import { authMiddleware } from './api/auth';
import { initializeWebSocketService } from './services/websocket.service';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'aida-whatsapp-auth',
    version: '1.0.0'
  });
});

// Auth routes (public)
app.use('/api/auth', createAuthRoutes());

// Instance management routes (protected)
app.use('/api/instances', createInstanceRoutes());

// Webhook routes (public)
app.use('/api/webhook', createWebhookRoutes());

// Protected routes example (require authentication)
app.get('/api/protected', authMiddleware, (req, res) => {
  const user = (req as any).user;
  res.json({
    message: 'This is a protected route',
    user: {
      id: user.userId,
      phone: user.phone,
      businessId: user.businessId
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Initialize WebSocket service
const webSocketService = initializeWebSocketService(httpServer);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 AIDA WhatsApp Auth Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🤖 Evolution API URL: ${process.env.EVOLUTION_API_URL || 'http://localhost:8080'}`);
  console.log(`🔌 WebSocket enabled for real-time updates`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('  GET  /health - Health check');
  console.log('  POST /api/auth/send-code - Send verification code');
  console.log('  POST /api/auth/verify-code - Verify code');
  console.log('  GET  /api/auth/me - Get current user');
  console.log('  POST /api/auth/logout - Logout');
  console.log('  GET  /api/auth/admin-qr - Get admin QR code (dev only)');
  console.log('  GET  /api/auth/health - Auth service health');
  console.log('  POST /api/instances/create - Create WhatsApp instance');
  console.log('  GET  /api/instances - List user instances');
  console.log('  GET  /api/instances/:id/status - Get instance status');
  console.log('  GET  /api/instances/:id/qr-code - Get QR code');
  console.log('  DELETE /api/instances/:id - Delete instance');
  console.log('  POST /api/instances/:id/send-message - Send test message');
  console.log('  POST /api/webhook/instances/:name - Instance webhook');
  console.log('  GET  /api/protected - Protected route example');
  console.log('  WS   /socket.io - WebSocket connection');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

export default app;