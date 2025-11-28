const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(err.status || 500).json({
        error: {
            message: isDevelopment ? err.message : 'An error occurred',
            ...(isDevelopment && { stack: err.stack }),
        },
    });
};

module.exports = errorHandler;
