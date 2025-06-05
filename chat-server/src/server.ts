import express from 'express';
import cors from 'cors';
// Polyfill EventSource for Node.js environment
import { EventSource } from 'eventsource';
(global as any).EventSource = EventSource;

import { appConfig, getMCPConfig } from './utils/config';
import { logger, requestLogger } from './utils/logger';
import { ChatService } from './services/chat.service';
import { getMCPService } from './services/mcp';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Initialize services
const mcpService = getMCPService();
const chatService = new ChatService();

// Register YDB MCP server
async function initializeMCPServers() {
    try {
        const mcpConfig = getMCPConfig();
        
        logger.info('Starting MCP server initialization', {
            serverUrl: mcpConfig.serverUrl,
            timeout: mcpConfig.timeout
        });
        
        await mcpService.registerServer({
            name: 'ydb-mcp-server',
            type: 'sse',
            url: mcpConfig.serverUrl,
        });
        
        logger.info('MCP server registered, attempting connection...');
        
        // Connect to the server
        await mcpService.connectServer('ydb-mcp-server');
        
        // Get available tools to verify connection
        const tools = mcpService.getAllTools();
        
        logger.info('YDB MCP server registered and connected', {
            url: mcpConfig.serverUrl,
            toolsDiscovered: tools.length,
            tools: tools.map(t => t.name)
        });
    } catch (error) {
        logger.error('Failed to initialize MCP servers', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
    }
}

// Initialize MCP servers
initializeMCPServers();

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: process.env['npm_package_version'] || '1.0.0'
    });
});

// Simple stateless chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, model, temperature, maxTokens, context } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        // Set response headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        logger.info('Chat request received', { 
            messageCount: messages.length,
            context: context ? {
                url: context.url,
                pathname: context.pathname
            } : 'none'
        });

        // Process chat with callback for streaming
        await chatService.processChat(
            messages,
            (data) => res.write(data),
            { model, temperature, maxTokens, context }
        );

        res.end();
        return;
    } catch (error) {
        logger.error('Chat error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        
        if (!res.headersSent) {
            res.status(500).json({ error: errorMessage });
        } else {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: errorMessage
            })}\n\n`);
            res.end();
        }
    }
});


// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
    });

    return res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((_req, res) => {
    return res.status(404).json({ error: 'Not found' });
});

// Start server
const port = appConfig.PORT;
app.listen(port, () => {
    logger.info(`Chat server started on port ${port}`, {
        environment: appConfig.NODE_ENV,
        logLevel: appConfig.LOG_LEVEL,
    });
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

export default app;
