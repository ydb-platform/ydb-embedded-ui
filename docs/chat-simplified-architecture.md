# Simplified Chat Architecture - Using Existing Backend

## Revised Architecture

Instead of a standalone Node.js backend, we integrate directly with the existing YDB backend:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   YDB Backend   │    │   MCP Server    │
│   (React App)   │◄──►│   (Existing)    │◄──►│   (Existing)    │
│   Port: 3000    │    │   Port: 8765    │    │   Port: 8784    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   setupProxy.js │    │   Eliza API     │    │   YDB Cluster   │
│   (Routes /chat)│    │   (LLM Service) │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Implementation Plan

### 1. Update Proxy Configuration

**Update `src/setupProxy.js`:**
```javascript
/* eslint-env node */
const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function (app) {
    const metaYdbBackend = process.env.META_YDB_BACKEND;
    if (metaYdbBackend && metaYdbBackend !== 'undefined') {
        // Existing meta proxy
        app.use(
            '/meta',
            createProxyMiddleware({
                target: metaYdbBackend,
                changeOrigin: true,
            }),
        );
        
        // New chat proxy - routes to same backend
        app.use(
            '/chat',
            createProxyMiddleware({
                target: metaYdbBackend,
                changeOrigin: true,
                // Enable streaming for SSE
                onProxyReq: (proxyReq, req, res) => {
                    if (req.method === 'POST' && req.url.includes('/chat')) {
                        proxyReq.setHeader('Accept', 'text/event-stream');
                    }
                },
                onProxyRes: (proxyRes, req, res) => {
                    if (req.url.includes('/chat')) {
                        proxyRes.headers['Cache-Control'] = 'no-cache';
                        proxyRes.headers['Connection'] = 'keep-alive';
                    }
                }
            }),
        );
    }
};
```

### 2. Frontend Chat Components

**Create `src/features/chat/` structure:**

```
src/features/chat/
├── components/
│   ├── ChatPanel/
│   │   ├── ChatPanel.tsx
│   │   ├── ChatPanel.scss
│   │   └── index.ts
│   ├── ChatMessage/
│   │   ├── ChatMessage.tsx
│   │   ├── ChatMessage.scss
│   │   └── index.ts
│   ├── ChatInput/
│   │   ├── ChatInput.tsx
│   │   ├── ChatInput.scss
│   │   └── index.ts
│   └── ToolResult/
│       ├── ToolResult.tsx
│       ├── ToolResult.scss
│       └── index.ts
├── hooks/
│   ├── useChat.ts
│   ├── useEventSource.ts
│   └── index.ts
├── types/
│   ├── chat.ts
│   └── index.ts
├── api/
│   ├── chatApi.ts
│   └── index.ts
└── i18n/
    ├── en.json
    └── index.ts
```

### 3. Backend Integration Points

The YDB backend needs to implement these endpoints:

1. **POST /chat/completions** - Stream chat completions
2. **GET /chat/tools** - List available MCP tools
3. **POST /chat/tools/invoke** - Invoke MCP tool

### 4. Key Implementation Details

#### Frontend EventSource Hook
```typescript
// src/features/chat/hooks/useEventSource.ts
export function useEventSource(
    url: string, 
    onMessage: (data: ChatDelta) => void,
    onError?: (error: Event) => void
) {
    const [controller] = useState(() => new AbortController());
    
    useEffect(() => {
        const eventSource = new EventSource(url, { 
            withCredentials: true 
        });
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('Failed to parse SSE data:', error);
            }
        };
        
        eventSource.onerror = (error) => {
            onError?.(error);
        };
        
        return () => {
            eventSource.close();
            controller.abort();
        };
    }, [url]);
    
    return () => controller.abort();
}
```

#### Chat API Service
```typescript
// src/features/chat/api/chatApi.ts
export class ChatAPI {
    static async sendMessage(messages: ChatMessage[]): Promise<string> {
        const response = await fetch('/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages,
                stream: true,
            }),
        });
        
        if (!response.ok) {
            throw new Error(`Chat API error: ${response.statusText}`);
        }
        
        // Return the URL for EventSource
        return `/chat/completions?session=${Date.now()}`;
    }
    
    static async getAvailableTools(): Promise<MCPTool[]> {
        const response = await fetch('/chat/tools');
        return response.json();
    }
}
```

### 5. Integration with Existing UI

#### Add Chat Panel to Main Layout
```typescript
// Update existing layout component to include chat panel
const MainLayout: React.FC = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    return (
        <div className="main-layout">
            <Header />
            <div className="content-area">
                <main className="main-content">
                    {/* Existing content */}
                </main>
                
                {/* Chat Panel - slides in from right */}
                <ChatPanel 
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                />
            </div>
            
            {/* Chat Toggle Button */}
            <button 
                className="chat-toggle-btn"
                onClick={() => setIsChatOpen(!isChatOpen)}
                aria-label="Toggle AI Assistant"
            >
                🤖
            </button>
        </div>
    );
};
```

### 6. Backend Requirements

The YDB backend needs to implement:

1. **Chat Streaming Endpoint**
   - Accept POST requests to `/chat/completions`
   - Stream responses using Server-Sent Events
   - Integrate with Eliza API for LLM processing
   - Handle tool calls via existing MCP server

2. **MCP Integration**
   - Connect to existing MCP server at `http://ui-dev-0.ydb.yandex.net:8784/meta/mcp`
   - Proxy tool calls and results
   - Handle tool schema updates

3. **Authentication**
   - Use existing auth mechanisms
   - Ensure chat requests are properly authenticated

### 7. Environment Variables

Add to `.env.example`:
```bash
# Chat Configuration
REACT_APP_CHAT_ENABLED=true
REACT_APP_ELIZA_API_URL=https://api.eliza.yandex.net/raw/openai/v1
```

### 8. Benefits of This Approach

1. **Reuses Existing Infrastructure** - No new backend service needed
2. **Consistent Authentication** - Uses existing auth flow
3. **Simplified Deployment** - No additional deployment complexity
4. **Existing MCP Integration** - Leverages current MCP server setup
5. **Proxy Benefits** - Development proxy already handles CORS, etc.

### 9. Implementation Steps

1. Update `setupProxy.js` to route `/chat` requests
2. Create frontend chat components and hooks
3. Implement backend chat endpoints in YDB backend
4. Add MCP integration to backend
5. Update main layout to include chat panel
6. Add environment configuration
7. Test end-to-end functionality

This approach is much simpler and more aligned with the existing architecture than creating a standalone Node.js backend.