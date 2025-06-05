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
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ User Query  │───►│ Page        │───►│ Chat        │───►│ AI          │
│             │    │ Context     │    │ Server      │    │ Processing  │
│ "Show DBs"  │    │ Extraction  │    │ + History   │    │ + Tools     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Live        │◄───│ Streaming   │◄───│ YDB         │◄───│ Tool        │
│ UI Update   │    │ Response    │    │ Operations  │    │ Execution   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 2. Agent Loop Process

```
┌─────────────┐
│ User Query  │
└──────┬──────┘
       │
┌──────▼──────┐
│ AI Analysis │
│ + Context   │
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
- **Context Awareness**: Automatically detects current page (cluster, node, database)
- **State Management**: Redux-based message history and session control
- **Design System Integration**: Uses standard YDB UI components and class naming conventions

### Middleware Layer

- **Chat Server**: Node.js service handling AI communication
- **Agent Loop**: Multi-iteration processing with tool integration
- **Proxy Integration**: Development-friendly routing and production deployment

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
User Input → Context + History → AI Processing → Tool Execution →
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
- **Transparent Execution**: User sees exactly what operations are being performed

### 3. Streaming Architecture

- **Immediate Feedback**: Responses start appearing instantly
- **Progressive Enhancement**: Content builds up in real-time
- **Session Management**: Proper handling of multiple concurrent conversations

### 4. Dual Deployment

- **Development Friendly**: Integrated proxy for seamless local development
- **Production Ready**: Standalone server for enterprise deployment
- **Flexible Scaling**: Can scale independently from main YDB UI

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

## Conclusion

The YDB AI Chat represents a new paradigm for database administration interfaces:

- **Natural Language Interface**: Complex database operations through simple conversation
- **Real-Time Intelligence**: Always current data with immediate responses
- **Context Awareness**: Understands user intent based on current UI state
- **Enterprise Ready**: Scalable, secure, and production-grade architecture

This implementation demonstrates how AI can be seamlessly integrated into existing enterprise tools to dramatically improve user experience while maintaining reliability and security standards.
