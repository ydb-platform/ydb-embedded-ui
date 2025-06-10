# YDB Embedded UI Chat Feature - Architecture Overview

## System Overview

The YDB AI Chat is a real-time assistant that helps users interact with YDB clusters through natural language. It combines streaming AI responses with live database operations via the Model Context Protocol (MCP).

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              YDB AI Chat System                             │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────┤
│   Frontend      │   Middleware    │   AI Service    │   Database Layer    │
│                 │                 │                 │                     │
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────────┐ │
│ │ React UI    │ │ │ Chat Server │ │ │ Eliza API   │ │ │ YDB MCP Server  │ │
│ │             │ │ │             │ │ │             │ │ │                 │ │
│ │ • Chat Panel│◄┼►│ • Streaming │◄┼►│ • LLM       │◄┼►│ • YDB Tools     │ │
│ │ • Messages  │ │ │ • Agent Loop│ │ │ • Tool Calls│ │ │ • Live Data     │ │
│ │ • Context   │ │ │ • MCP Client│ │ │ • Streaming │ │ │ • Operations    │ │
│ └─────────────┘ │ └─────────────┘ │ └─────────────┘ │ └─────────────────┘ │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────┘
```

## Core Workflow

### 1. User Interaction Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ User Query  │───►│ Chat        │───►│ AI          │
│             │    │ Server      │    │ Processing  │
│ "Show DBs"  │    │ + History   │    │ + Tools     │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Live        │◄───│ Streaming   │◄───│ YDB         │
│ UI Update   │    │ Response    │    │ Operations  │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                    ┌─────────────┐
                                    │ Tool        │
                                    │ Execution   │
                                    └─────────────┘
```

### 2. Agent Loop Process

```
┌─────────────┐
│ User Query  │
└──────┬──────┘
       │
┌──────▼──────┐
│ AI Analysis │
└──────┬──────┘
       │
┌──────▼──────┐    ┌─────────────┐    ┌─────────────┐
│ Need Tools? │───►│ Execute     │───►│ Get Results │
│             │Yes │ YDB Tools   │    │ from DB     │
└──────┬──────┘    └─────────────┘    └──────┬──────┘
       │No                                   │
    ┌──▼──┐                            ┌─────▼─────┐
    │Done │                            │ Continue  │
    └─────┘                            │ Analysis  │
                                       └───────────┘
```

## Key Components

### Frontend Layer

- **Chat Interface**: Real-time messaging UI with streaming responses using @gravity-ui/navigation Drawer component
- **State Management**: Redux-based message history and session control
- **Design System Integration**: Uses standard YDB UI components and class naming conventions

### Backend Layer (Modular Architecture)

- **Chat Server**: Minimal Node.js Express service with only essential endpoints
  - `GET /health` - Basic health check with version info
  - `POST /api/chat` - Streaming chat with Server-Sent Events (SSE)
- **ChatService**: Orchestrates the Agent Loop with modular components
  - Multi-iteration processing (max 5 iterations)
  - Delegates to specialized services for clean separation of concerns
- **StreamProcessor**: Handles streaming response processing
  - Accumulates content chunks from AI responses
  - Manages tool call assembly from streaming deltas
  - Sends real-time updates to frontend via SSE
- **ToolExecutor**: Manages tool call execution
  - Parses tool arguments and validates calls
  - Executes MCP tool calls via MCPService
  - Formats results for AI consumption
- **PromptBuilder**: Creates system prompts for AI assistant
  - Generates intelligent prompts with tool descriptions
  - Includes usage guidelines and best practices
- **LLMService**: OpenAI API client for Eliza communication
  - Streaming chat completions with tool support
  - OAuth authentication with Ya-Pool headers
- **MCPService**: Model Context Protocol client
  - Server-Sent Events (SSE) transport for YDB MCP server
  - Tool discovery and caching (loaded once at startup)
  - Connection management and health monitoring

### AI Service Layer

- **Eliza API**: OpenAI-compatible LLM service
- **Streaming**: Real-time token generation
- **Tool Integration**: Function calling for database operations

### Database Layer

- **MCP Protocol**: Model Context Protocol for tool communication
- **YDB Tools**: Live cluster operations (list databases, check health, etc.)
- **Real Data**: Always current information from actual YDB instances

## Deployment Strategies

### Development Mode

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ React Dev   │───►│ Proxy       │───►│ Chat Server │
│ :3000       │    │ Middleware  │    │ :3001       │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                    ┌─────────────┐
                                    │ YDB MCP     │
                                    │ Server      │
                                    └─────────────┘
```

### Production Mode

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Static      │───►│ Load        │───►│ Chat Server │
│ React App   │    │ Balancer    │    │ Cluster     │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                    ┌─────────────┐
                                    │ YDB MCP     │
                                    │ Production  │
                                    └─────────────┘
```

## Data Flow Patterns

### Message Lifecycle

```
User Input → Message History → AI Processing → Tool Execution →
Streaming Response → UI Update → Ready for Next Query
```

### Streaming Session

```
Start Session → Create Message → Stream Content →
Handle Tools → Complete Response → End Session
```

## Key Innovations

### 1. Context-Aware Intelligence

- **Smart Detection**: Automatically understands what page user is viewing
- **Relevant Responses**: Focuses on current cluster/database/node
- **Dynamic Context**: Updates as user navigates through YDB UI

### 2. Real-Time Tool Integration

- **Live Data**: Always queries actual YDB state, never cached responses
- **Multi-Step Operations**: Can perform complex workflows across multiple tools
- **Seamless Execution**: Tool calls happen behind the scenes during Agent Loop iterations

### 3. Streaming Architecture

- **Immediate Feedback**: Responses start appearing instantly
- **Progressive Enhancement**: Content builds up in real-time
- **Session Management**: Proper handling of multiple concurrent conversations

### 4. Dual Deployment

- **Development Friendly**: Integrated proxy for seamless local development
- **Production Ready**: Standalone server for enterprise deployment
- **Flexible Scaling**: Can scale independently from main YDB UI

## Technical Implementation

### Configuration

**Server Configuration:**

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode
- `LOG_LEVEL` - Logging verbosity

**Eliza API Configuration:**

- `ELIZA_API_KEY` - OAuth token for authentication
- `ELIZA_BASE_URL` - API endpoint URL
- `ELIZA_MODEL` - LLM model identifier

**MCP Configuration:**

- `MCP_SERVER_URL` - YDB MCP server endpoint
- `MCP_TIMEOUT` - Connection timeout in milliseconds

### API Endpoints

**Health Check:**

```
GET /health
Response: { status: 'ok', timestamp: ISO8601, version: string }
```

**Chat Streaming:**

```
POST /api/chat
Content-Type: application/json
Body: {
  messages: ChatMessage[],
  model?: string,
  temperature?: number,
  maxTokens?: number
}

Response: text/event-stream (SSE)
Events: content, done, error
```

## Technical Characteristics

### UI Architecture

- **Drawer Component**: Uses @gravity-ui/navigation Drawer and DrawerItem for consistent UI behavior
- **Class Naming**: Follows YDB UI conventions with `cn` utility and BEM methodology (`ydb-chat-drawer`)
- **Responsive Design**: Resizable drawer with localStorage persistence (default 400px width)
- **Smooth Scrolling**: Optimized scroll behavior without layout jumps

### Performance

- **Sub-second Response Start**: Streaming begins immediately
- **Efficient Tool Calls**: Optimized database operations
- **Memory Management**: Automatic conversation cleanup
- **Connection Pooling**: Reused connections for better performance

### Reliability

- **Graceful Degradation**: Works even if some services are down
- **Error Recovery**: Automatic retry with exponential backoff
- **Health Monitoring**: Continuous service health checks
- **Fallback Modes**: Multiple deployment options for different scenarios

### Security

- **Session Isolation**: No data leakage between users
- **Secure Communication**: Encrypted connections throughout
- **Input Validation**: Comprehensive sanitization
- **Audit Logging**: Full operation tracking

## Future Roadmap

### Short Term

- **Enhanced Context**: Deeper integration with YDB UI state
- **Rich Responses**: Charts and visualizations in chat
- **Voice Interface**: Speech-to-text and text-to-speech

### Long Term

- **Multi-User Collaboration**: Shared chat sessions
- **Advanced Workflows**: Complex multi-step database operations
- **Custom Tools**: User-defined operations and shortcuts
- **Integration Hub**: Connect with external monitoring and alerting systems

## Recent Critical Fixes (December 2024)

### Tool Calls Synchronization Issue

**Problem**: OpenAI API was rejecting requests due to mismatched tool_calls and tool results:

```
An assistant message with 'tool_calls' must be followed by tool messages responding to each 'tool_call_id'
```

**Root Cause**:

- Agent Loop was generating multiple tool_calls across iterations
- Client was only receiving the last iteration's tool_calls
- Tool results were being sent for ALL iterations, creating ID mismatches

**Solution**:

- **Client-side accumulation**: Modified `chatSlice.ts` to accumulate tool_calls instead of replacing them
- **Streaming coordination**: Ensured tool_calls are sent after each Agent Loop iteration
- **Proper sequencing**: Tool results now correctly match their corresponding tool_calls

**Files Modified**:

- `src/features/chat/store/chatSlice.ts` - Tool calls accumulation logic
- `chat-server/src/services/chat.service.ts` - Agent Loop streaming coordination

### Agent Loop Streaming Architecture

**Enhancement**: Improved the Agent Loop to properly handle multi-iteration tool execution:

```typescript
// Before: Only last iteration tool_calls sent
tool_calls: lastIterationCalls

// After: All iterations accumulated
tool_calls: [...iteration1Calls, ...iteration2Calls, ...]
```

**Benefits**:

- ✅ Consistent OpenAI API compliance
- ✅ Proper tool execution tracking
- ✅ Better debugging and error handling
- ✅ Support for complex multi-step operations

### Streaming Response Processing

**Improvement**: Enhanced StreamProcessor to handle edge cases:

- Empty content with tool_calls only
- Partial tool_call chunks in streaming
- Proper message history construction

**Result**: More reliable streaming with better error recovery and consistent message formatting.

## Conclusion

The YDB AI Chat represents a new paradigm for database administration interfaces:

- **Natural Language Interface**: Complex database operations through simple conversation
- **Real-Time Intelligence**: Always current data with immediate responses
- **Context Awareness**: Understands user intent based on current UI state
- **Enterprise Ready**: Scalable, secure, and production-grade architecture
- **Battle-Tested**: Robust handling of complex streaming scenarios and tool execution

This implementation demonstrates how AI can be seamlessly integrated into existing enterprise tools to dramatically improve user experience while maintaining reliability and security standards. The recent fixes ensure production-grade stability for complex multi-tool operations.
