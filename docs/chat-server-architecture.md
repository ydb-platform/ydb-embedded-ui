# Standalone Chat Server Architecture

## Overview
Refactor the chat implementation to use a dedicated TypeScript server that handles all chat and MCP logic, separating it from the React development proxy.

## New Architecture

```
React UI ↔️ setupProxy.js ↔️ Standalone Chat Server ↔️ Eliza API + MCP Server
```

### Benefits of Standalone Server
1. **Separation of Concerns** - Chat logic isolated from development proxy
2. **Production Ready** - Can run independently in production
3. **Better Testing** - Easier to unit test chat server logic
4. **Scalability** - Can be deployed separately and scaled independently
5. **Type Safety** - Full TypeScript implementation with proper error handling

## Implementation Plan

### 1. Chat Server Structure
```
chat-server/
├── src/
│   ├── server.ts           # Express server setup
│   ├── routes/
│   │   ├── chat.ts         # Chat endpoints
│   │   ├── health.ts       # Health check endpoints
│   │   └── tools.ts        # MCP tools endpoints
│   ├── services/
│   │   ├── llm.ts          # Eliza API integration
│   │   ├── mcp.ts          # MCP client service
│   │   └── streaming.ts    # SSE streaming service
│   ├── types/
│   │   ├── chat.ts         # Chat-related types
│   │   ├── mcp.ts          # MCP-related types
│   │   └── api.ts          # API request/response types
│   ├── middleware/
│   │   ├── cors.ts         # CORS configuration
│   │   ├── auth.ts         # Authentication middleware
│   │   └── error.ts        # Error handling
│   └── utils/
│       ├── logger.ts       # Logging utility
│       └── config.ts       # Configuration management
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### 2. Updated setupProxy.js
```javascript
// Simplified proxy - only routes to chat server
module.exports = function (app) {
    // Existing YDB meta proxy
    if (metaYdbBackend) {
        app.use('/meta', createProxyMiddleware({
            target: metaYdbBackend,
            changeOrigin: true,
        }));
    }

    // New chat server proxy
    app.use('/chat', createProxyMiddleware({
        target: process.env.CHAT_SERVER_URL || 'http://localhost:3001',
        changeOrigin: true,
        ws: true, // WebSocket support for SSE
    }));
};
```

### 3. Chat Server Endpoints

#### Core Endpoints
- `POST /chat/completions` - Stream chat responses with tool execution
- `GET /chat/health` - Health check with MCP connection status
- `GET /chat/tools` - List available MCP tools
- `POST /chat/tools/invoke` - Direct tool invocation (for testing)

#### Streaming Implementation
- Server-Sent Events for real-time responses
- Proper connection management and cleanup
- Error handling and reconnection logic

### 4. Environment Configuration

#### Chat Server (.env)
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Eliza API
ELIZA_KEY=your-eliza-api-key
ELIZA_BASE_URL=https://api.eliza.yandex.net/raw/openai/v1
MODEL_NAME=gpt-4o-mini

# MCP Server
MCP_SERVER_URL=http://ui-dev-0.ydb.yandex.net:8784/meta/mcp

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
```

#### React App (.env)
```bash
# Chat Server URL
REACT_APP_CHAT_SERVER_URL=http://localhost:3001
```

## Implementation Steps

### Phase 1: Server Setup
1. Create chat-server directory structure
2. Setup TypeScript configuration and dependencies
3. Implement basic Express server with CORS and error handling
4. Add health check endpoint

### Phase 2: MCP Integration
1. Create MCP client service with connection management
2. Implement tool discovery and execution
3. Add proper error handling and reconnection logic
4. Create tools endpoint for frontend discovery

### Phase 3: LLM Integration
1. Implement Eliza API client service
2. Add streaming response handling
3. Integrate tool calls with MCP service
4. Implement chat completions endpoint

### Phase 4: Frontend Integration
1. Update setupProxy.js to route to chat server
2. Update frontend API calls to use new endpoints
3. Test streaming and tool execution
4. Add proper error handling

### Phase 5: Production Deployment
1. Add Docker configuration for chat server
2. Setup production environment variables
3. Add monitoring and logging
4. Deploy alongside YDB UI

## Development Workflow

### Local Development
```bash
# Terminal 1: Start chat server
cd chat-server
npm run dev

# Terminal 2: Start React app
npm start
```

### Production Deployment
```bash
# Build chat server
cd chat-server
npm run build

# Deploy chat server (Docker/PM2/etc.)
npm run start:prod

# Deploy React app with chat server URL
REACT_APP_CHAT_SERVER_URL=https://chat-server.ydb.example.com npm run build
```

## Key Benefits

1. **Clean Architecture** - Clear separation between development proxy and chat logic
2. **Independent Deployment** - Chat server can be deployed and scaled separately
3. **Better Testing** - Isolated chat server logic is easier to test
4. **Production Ready** - Proper error handling, logging, and monitoring
5. **Type Safety** - Full TypeScript implementation throughout
6. **Maintainability** - Easier to maintain and extend chat functionality

This architecture provides a much cleaner separation of concerns while maintaining all the functionality of the original implementation.