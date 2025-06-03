import express from 'express';
import cors from 'cors';
import { appConfig, getMCPConfig } from './utils/config';
import { logger, requestLogger } from './utils/logger';
import { ChatService } from './services/chat.service';
import { getMCPService } from './services/mcp.service';
import { ChatCompletionOptions } from './types/chat';
import { AppError } from './utils/errors';

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
        
        await mcpService.registerServer({
            name: 'ydb-mcp-server',
            type: 'sse',
            url: mcpConfig.serverUrl,
        });
        
        // Connect to the server
        await mcpService.connectServer('ydb-mcp-server');
        
        logger.info('YDB MCP server registered and connected', { url: mcpConfig.serverUrl });
    } catch (error) {
        logger.error('Failed to initialize MCP servers', { error: error instanceof Error ? error.message : String(error) });
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

// Chat endpoints
app.post('/api/chat/sessions', async (req, res) => {
    try {
        const { userId } = req.body;
        const session = await chatService.createSession(userId);
        res.json(session);
    } catch (error) {
        logger.error('Failed to create chat session', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ error: 'Failed to create session' });
    }
});
app.get('/api/chat/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await chatService.getSession(sessionId);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        return res.json(session);
    } catch (error) {
        logger.error('Failed to get chat session', { error: error instanceof Error ? error.message : String(error), sessionId: req.params.sessionId });
        return res.status(500).json({ error: 'Failed to get session' });
    }
});
app.post('/api/chat/sessions/:sessionId/messages', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { content, role = 'user' } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const message = await chatService.addMessage(sessionId, {
            role,
            content,
        });

        return res.json(message);
    } catch (error) {
        logger.error('Failed to add message', { error: error instanceof Error ? error.message : String(error), sessionId: req.params.sessionId });
        return res.status(500).json({ error: 'Failed to add message' });
    }
});

app.post('/api/chat/sessions/:sessionId/complete', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const options: ChatCompletionOptions = req.body;

        // Set response headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        const stream = chatService.streamCompletion(sessionId, options);

        for await (const delta of stream) {
            res.write(`data: ${JSON.stringify(delta)}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Failed to complete chat', { error: errorMessage, sessionId: req.params.sessionId });
        
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to complete chat' });
        } else {
            res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
            res.end();
        }
    }
});

// Direct chat endpoint (compatible with setupProxy.js pattern)
app.post('/api/chat', async (req, res) => {
    try {
        // Set SSE headers
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

        const { messages } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: 'Invalid messages format'
            })}\n\n`);
            res.end();
            return;
        }

        logger.info('Direct chat request received', { messageCount: messages.length });

        // Use the chat service to handle the request
        const stream = chatService.streamDirectChatCompletion(messages);

        for await (const delta of stream) {
            res.write(`data: ${JSON.stringify(delta)}\n\n`);
        }

        // Send completion
        res.write(`data: ${JSON.stringify({
            type: 'done'
        })}\n\n`);
        res.end();

    } catch (error) {
        logger.error('Chat error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        res.write(`data: ${JSON.stringify({
            type: 'error',
            error: errorMessage
        })}\n\n`);
        res.end();
    }
});

// MCP endpoints
app.get('/api/mcp/servers', async (_req, res) => {
    try {
        const servers = mcpService.getServers();
        res.json(servers);
    } catch (error) {
        logger.error('Failed to list MCP servers', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ error: 'Failed to list servers' });
    }
});

app.post('/api/mcp/servers/:serverId/tools/:toolName', async (req, res) => {
    try {
        const { serverId, toolName } = req.params;
        const { arguments: args } = req.body;

        const result = await mcpService.callTool(serverId, toolName, args);
        res.json(result);
    } catch (error) {
        logger.error('Failed to call MCP tool', {
            error: error instanceof Error ? error.message : String(error),
            serverId: req.params.serverId,
            toolName: req.params.toolName
        });
        res.status(500).json({ error: 'Failed to call tool' });
    }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            error: error.message,
            code: error.code,
        });
    }

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