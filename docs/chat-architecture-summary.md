# AI Assistant Architecture Summary

## Overview

Integration of an AI assistant into YDB Embedded UI using existing backend infrastructure and MCP (Model Context Protocol) for YDB operations.

## Key Architectural Decisions

### 1. **Simplified Backend Integration**
- **No standalone Node.js backend** - Use existing YDB backend
- **Proxy-based routing** - Extend `setupProxy.js` to route `/chat` requests
- **Leverage existing auth** - No additional authentication layer needed

### 2. **Frontend Architecture**
```
src/features/chat/
├── components/          # React components (ChatPanel, ChatMessage, etc.)
├── hooks/              # Custom hooks (useChat, useEventSource)
├── store/              # Redux slice for chat state
├── api/                # Chat API service layer
└── types/              # TypeScript definitions
```

### 3. **Communication Flow**
```
React UI → setupProxy.js → YDB Backend → Eliza LLM
    ↑                                        ↓
    ←─── Server-Sent Events ←─── MCP Tools ←─┘
```

## Implementation Phases

### Phase 1: Infrastructure Setup
- [ ] Update `setupProxy.js` for `/chat` routing with SSE support
- [ ] Create basic chat feature structure
- [ ] Define TypeScript interfaces for chat messages and MCP tools

### Phase 2: Frontend Components
- [ ] `ChatPanel` - Main chat interface (slide-out panel)
- [ ] `ChatMessage` - Individual message display
- [ ] `ChatInput` - Message input with streaming controls
- [ ] `ToolResult` - Display MCP tool execution results

### Phase 3: Backend Integration
- [ ] Chat API endpoints in YDB backend:
  - `POST /chat/completions` - Stream chat responses
  - `GET /chat/tools` - List available MCP tools
  - `POST /chat/tools/invoke` - Direct tool invocation
- [ ] MCP server integration for YDB operations
- [ ] Eliza LLM integration for chat completions

### Phase 4: UI Integration
- [ ] Add chat toggle button to main layout
- [ ] Implement keyboard shortcuts (⌘K for clear history)
- [ ] Add chat panel to existing page layouts
- [ ] Style integration with existing design system

## Technical Requirements

### Frontend Dependencies
- **Existing**: React 18, TypeScript, Redux Toolkit, @gravity-ui/uikit
- **New**: EventSource API for SSE, streaming response handling

### Backend Requirements
- **MCP Integration**: Connect to existing MCP server at port 8784
- **LLM Integration**: Eliza API for chat completions
- **Streaming**: Server-Sent Events support for real-time responses

### Environment Configuration
```bash
# Add to .env
REACT_APP_CHAT_ENABLED=true
REACT_APP_ELIZA_API_URL=https://api.eliza.yandex.net/raw/openai/v1
```

## Key Benefits

1. **Minimal Infrastructure Changes** - Reuses existing backend and proxy setup
2. **Consistent Authentication** - Uses current auth mechanisms
3. **MCP Integration** - Leverages existing YDB MCP server
4. **Incremental Development** - Can be built and tested in phases
5. **Design Consistency** - Integrates with existing UI components

## Next Steps

1. **Proof of Concept**: Start with Phase 1 to validate proxy routing and basic SSE
2. **MVP Components**: Build minimal ChatPanel and ChatInput for testing
3. **Backend Endpoints**: Implement basic chat API in YDB backend
4. **MCP Integration**: Connect chat system to existing MCP tools
5. **UI Polish**: Integrate with main layout and add keyboard shortcuts

This approach allows for incremental development while maintaining consistency with the existing YDB UI architecture.