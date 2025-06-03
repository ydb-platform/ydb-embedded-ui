# YDB Embedded UI Chat Feature - Simplified Stateless Architecture

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React UI      │◄──►│  Chat Server     │◄──►│   Eliza API     │
│                 │    │                  │    │                 │
│ - ChatPanel     │    │ - ChatService    │    │ - OpenAI Compat │
│ - ChatMessage   │    │ - Stateless      │    │ - Streaming     │
│ - Redux State   │    │ - Simple         │    │ - Tool Calls    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   MCP Server    │
                       │                 │
                       │ - YDB Tools     │
                       │ - Data Access   │
                       └─────────────────┘
```

## Simplified ChatService Architecture

### Core Principle
**Frontend manages all state, backend is purely stateless and processes requests**

### Single Service Design

```
ChatService (Stateless Processor)
├── processChat()           # Main processing method
├── validateMessages()      # Input validation
├── formatMessagesForLLM()  # Message formatting
├── getAvailableTools()     # Tool discovery
└── getHealthStatus()       # Health monitoring
```

### Dependencies
- **LLMService** - Eliza API communication
- **MCPService** - YDB tool integration

## Request Flow

### Stateless Chat Processing

```
1. Frontend → POST /api/chat { messages: [...] }
2. ChatService.processChat(messages, onData, options)
3. Validate messages
4. Get available MCP tools
5. Format messages for LLM
6. LLMService.createStreamingChatCompletion()
7. For each chunk:
   - Content → stream { type: 'content', content }
   - Tool calls → execute via MCPService
   - Results → stream { type: 'tool_result', result }
8. Stream { type: 'done' }
```

## Tool Execution Flow

```
1. LLM Response → tool_calls: [{ id, function: { name, arguments } }]
2. For each tool call:
   a. Stream { type: 'tool_executing', tool_name, tool_id }
   b. MCPService.callTool(serverName, toolName, arguments)
   c. Stream { type: 'tool_result', tool_id, result }
   d. Handle errors → { type: 'tool_error', tool_id, error }
```

## Data Flow Types

### ChatMessage (Input)
```typescript
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: number
  toolCalls?: ToolCall[]
  toolCallId?: string
}
```

### ChatDelta (Streaming Output)
```typescript
type ChatDelta = {
  type: 'content' | 'tool_call' | 'tool_executing' | 'tool_result' | 'tool_error' | 'done' | 'error'
  content?: string
  tool_calls?: ToolCall[]
  tool_name?: string
  tool_id?: string
  result?: any
  error?: string
}
```

## API Design

### Single Endpoint
```
POST /api/chat
{
  "messages": [
    {"role": "user", "content": "Show me cluster status"},
    {"role": "assistant", "content": "I'll check that for you..."},
    {"role": "user", "content": "What about database health?"}
  ],
  "model": "gpt-4.1"
}
```

### Response Format (SSE)
```
data: {"type":"content","content":"Hello"}
data: {"type":"tool_executing","tool_name":"get_cluster_info","tool_id":"call_123"}
data: {"type":"tool_result","tool_id":"call_123","result":{"status":"healthy"}}
data: {"type":"done"}
```

### Additional Endpoints
```
GET  /api/chat/health    # Health status
GET  /api/chat/tools     # Available MCP tools
GET  /health             # Server health
```

## Frontend Implementation

### ChatAPI (Simplified)
```typescript
class ChatAPI {
  static async sendMessage(
    messages: ChatMessage[],
    onDelta: (delta: ChatDelta) => void,
    onError: (error: Error) => void
  ): Promise<void>
  
  static async getAvailableTools(): Promise<MCPTool[]>
  static async getHealth(): Promise<HealthStatus>
}
```

### State Management
- **Redux manages conversation history** - No server-side sessions
- **Frontend sends full context** - Each request includes complete conversation
- **Optimistic UI updates** - Immediate feedback with streaming updates

## Error Handling

### Graceful Degradation
- **MCP Server Down** → Tools unavailable, chat continues without tools
- **LLM Service Down** → Error response, health check fails
- **Tool Execution Fails** → Error message in stream, conversation continues
- **Network Issues** → Frontend retry logic

### Error Response Format
```
data: {"type":"error","error":"Tool execution failed: Connection timeout"}
```

## Configuration

### Environment Variables
```bash
# LLM Service
ELIZA_KEY=oauth-token
ELIZA_BASE_URL=https://api.eliza.yandex.net/raw/openai/v1
MODEL_NAME=gpt-4.1

# MCP Integration
MCP_SERVER_URL=http://ui-dev-0.ydb.yandex.net:8784/meta/mcp

# Server
PORT=3001
LOG_LEVEL=info
```

## Benefits of Stateless Architecture

### Simplicity
- **No session management** - Eliminates complexity of session storage, cleanup, expiration
- **No state synchronization** - Frontend and backend don't need to stay in sync
- **Fewer failure modes** - No session-related errors or edge cases

### Scalability
- **Horizontal scaling** - Easy to load balance across multiple instances
- **Stateless services** - Each request is independent
- **No memory leaks** - No accumulating session data

### Development
- **Easier testing** - Pure functions, no state dependencies
- **Simpler debugging** - Each request is self-contained
- **Faster development** - Less boilerplate and infrastructure code

### Frontend Control
- **Redux owns state** - Conversation history managed where it belongs
- **Flexible UX** - Frontend can implement any conversation flow
- **Offline capability** - Conversation history persists in browser

## Implementation Comparison

### Before (Session-Based)
- 5 modular components (SessionManager, MessageManager, etc.)
- Complex generator-based streaming
- Session storage and cleanup
- Multi-endpoint API
- ~800 lines of code

### After (Stateless)
- Single ChatService class
- Simple callback-based streaming
- No server-side state
- Single endpoint API
- ~200 lines of code

## Tool Integration

### YDB MCP Tools Available
- Cluster status and health monitoring
- Database operations and queries
- Node management and diagnostics
- Storage operations and metrics
- Administrative functions

### Tool Execution
- **Automatic discovery** - Tools loaded from MCP server on startup
- **Real-time execution** - Tools called during conversation as needed
- **Error handling** - Tool failures don't break conversation flow
- **Streaming feedback** - Users see tool execution progress

This simplified architecture provides all the functionality of the original complex system while being much easier to understand, maintain, and scale.
