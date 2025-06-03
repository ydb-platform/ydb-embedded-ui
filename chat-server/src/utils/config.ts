import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const configSchema = z.object({
    // Server Configuration
    PORT: z.string().transform(Number).default('3001'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    HOST: z.string().default('localhost'),

    // Eliza API Configuration
    ELIZA_KEY: z.string().min(1, 'ELIZA_KEY is required'),
    ELIZA_BASE_URL: z.string().url().default('https://api.eliza.yandex.net/raw/openai/v1'),
    MODEL_NAME: z.string().default('gpt-4o-mini'),

    // MCP Server Configuration
    MCP_SERVER_URL: z.string().url().default('http://ui-dev-0.ydb.yandex.net:8784/meta/mcp'),

    // CORS Configuration
    ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),

    // Logging Configuration
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('debug'),
    LOG_FORMAT: z.enum(['json', 'simple']).default('json'),

    // Security
    API_KEY_HEADER: z.string().default('x-api-key'),
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

    // Health Check
    HEALTH_CHECK_INTERVAL_MS: z.string().transform(Number).default('30000'),
    MCP_CONNECTION_TIMEOUT_MS: z.string().transform(Number).default('5000'),
});

type Config = z.infer<typeof configSchema>;

let config: Config;

try {
    config = configSchema.parse(process.env);
} catch (error) {
    console.error('Configuration validation failed:', error);
    process.exit(1);
}

// Parse allowed origins
const allowedOrigins = config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());

export const appConfig = {
    ...config,
    ALLOWED_ORIGINS_ARRAY: allowedOrigins,
    isDevelopment: config.NODE_ENV === 'development',
    isProduction: config.NODE_ENV === 'production',
    isTest: config.NODE_ENV === 'test',
};

export type AppConfig = typeof appConfig;

// Validate required environment variables
export function validateConfig(): void {
    const requiredVars = ['ELIZA_KEY'];
    
    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            throw new Error(`Required environment variable ${varName} is not set`);
        }
    }
}

// Get configuration for specific services
export const getElizaConfig = () => ({
    apiKey: config.ELIZA_KEY,
    baseURL: config.ELIZA_BASE_URL,
    model: config.MODEL_NAME,
});

export const getMCPConfig = () => ({
    serverUrl: config.MCP_SERVER_URL,
    timeout: config.MCP_CONNECTION_TIMEOUT_MS,
    retryAttempts: 3,
    retryDelay: 1000,
});

export const getCorsConfig = () => ({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', config.API_KEY_HEADER],
});

export const getRateLimitConfig = () => ({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});