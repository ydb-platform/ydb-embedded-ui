import winston from 'winston';
import { appConfig } from './config';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

// Define colors for console output
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
};

winston.addColors(colors);

// Create formatters
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }: any) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
);

const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create transports
const transports: winston.transport[] = [
    new winston.transports.Console({
        format: appConfig.LOG_FORMAT === 'json' ? jsonFormat : consoleFormat,
    }),
];

// Add file transport in production
if (appConfig.isProduction) {
    transports.push(
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: jsonFormat,
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: jsonFormat,
        })
    );
}

// Create logger instance
export const logger = winston.createLogger({
    level: appConfig.LOG_LEVEL,
    levels,
    transports,
    exitOnError: false,
});

// Create specialized loggers for different components
export const createComponentLogger = (component: string) => {
    return {
        error: (message: string, meta?: any) => 
            logger.error(message, { component, ...meta }),
        warn: (message: string, meta?: any) => 
            logger.warn(message, { component, ...meta }),
        info: (message: string, meta?: any) => 
            logger.info(message, { component, ...meta }),
        debug: (message: string, meta?: any) => 
            logger.debug(message, { component, ...meta }),
    };
};

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    req.requestId = requestId;
    
    logger.info('Request started', {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
    });

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request completed', {
            requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
        });
    });

    next();
};

// Error logging helper
export const logError = (error: Error, context?: Record<string, any>) => {
    logger.error('Error occurred', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...context,
    });
};

// Performance logging helper
export const logPerformance = (operation: string, duration: number, context?: Record<string, any>) => {
    logger.info('Performance metric', {
        operation,
        duration,
        ...context,
    });
};

// Chat interaction logging
export const logChatInteraction = (type: 'request' | 'response' | 'tool_call' | 'error' | 'session_created' | 'message_added', data: any) => {
    logger.info('Chat interaction', {
        type,
        timestamp: new Date().toISOString(),
        ...data,
    });
};

export default logger;