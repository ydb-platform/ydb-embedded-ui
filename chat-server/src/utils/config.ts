import dotenv from 'dotenv';
import {z} from 'zod';

// Load environment variables
dotenv.config();

const configSchema = z.object({
    // Server Configuration
    PORT: z.string().transform(Number).default('3001'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Eliza API Configuration
    ELIZA_KEY: z.string().min(1, 'ELIZA_KEY is required'),
    ELIZA_BASE_URL: z.string().url().default('https://api.eliza.yandex.net/raw/openai/v1'),
    MODEL_NAME: z.string().default('gpt-4.1'),

    // MCP Server Configuration
    MCP_SERVER_URL: z.string().url().default('http://ui-dev-0.ydb.yandex.net:8784/meta/mcp'),

    // Logging Configuration
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('debug'),

    // MCP Connection
    MCP_CONNECTION_TIMEOUT_MS: z.string().transform(Number).default('5000'),
    MCP_TOOL_CALL_TIMEOUT_MS: z.string().transform(Number).default('30000'),
    MCP_TOOL_CALL_CONCURRENCY: z.string().transform(Number).default('3'),
});

type Config = z.infer<typeof configSchema>;

let config: Config;

try {
    config = configSchema.parse(process.env);
} catch (error) {
    console.error('Configuration validation failed:', error);
    process.exit(1);
}

export const appConfig = {
    ...config,
    isDevelopment: config.NODE_ENV === 'development',
    isProduction: config.NODE_ENV === 'production',
    isTest: config.NODE_ENV === 'test',
};

// Get configuration for specific services
export const getElizaConfig = () => ({
    apiKey: config.ELIZA_KEY,
    baseURL: config.ELIZA_BASE_URL,
    model: config.MODEL_NAME,
});

export const getMCPConfig = () => ({
    serverUrl: config.MCP_SERVER_URL,
    connectionTimeout: config.MCP_CONNECTION_TIMEOUT_MS,
    toolCallTimeout: config.MCP_TOOL_CALL_TIMEOUT_MS,
    toolCallConcurrency: config.MCP_TOOL_CALL_CONCURRENCY,
    retryAttempts: 3,
    retryDelay: 1000,
});
