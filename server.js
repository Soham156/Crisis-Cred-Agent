const express = require('express');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/error-handler');
const webhookRoutes = require('./src/routes/webhook.routes');
const dataIngestionService = require('./src/services/data-ingestion.service');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize data ingestion (schedule periodic updates)
dataIngestionService.scheduleUpdates();


// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        query: req.query,
        ip: req.ip,
    });
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Routes
app.use('/webhook', webhookRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server only if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
    const PORT = config.server.port;
    app.listen(PORT, () => {
        logger.info(`🚀 Crisis Cred server running on port ${PORT}`);
        logger.info(`Environment: ${config.server.nodeEnv}`);
        logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        logger.info('SIGTERM received, shutting down gracefully');
        process.exit(0);
    });

    process.on('SIGINT', () => {
        logger.info('SIGINT received, shutting down gracefully');
        process.exit(0);
    });
}

module.exports = app;

