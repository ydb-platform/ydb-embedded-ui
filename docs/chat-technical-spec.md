# Chat Assistant Technical Specification

## Component Architecture

### Frontend Components

#### 1. ChatPanel Component

**Location:** `src/features/chat/components/ChatPanel/ChatPanel.tsx`

```typescript
interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface ChatPanelState {
  messages: ChatMessage[];
  isStreaming: boolean;
  isConnected: boolean;
  error: string | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  className
}) => {
  const {
    messages,
    sendMessage,
    isStreaming,
    isConnected,
    error,
    clearHistory
  } = useChatStream();

  const {
    currentDatabase,
    currentCluster,
    userContext
  } = useYDBContext();

  // Auto-scroll to bottom on new messages
  // Handle keyboard shortcuts (Escape to close)
  // Manage focus for accessibility
  
  return (
    <div className={b('chat-panel', {open: isOpen})}>
      <ChatHeader onClose={onClose} onClear={clearHistory} />
      <ChatMessageList messages={messages} />
      <ChatInput 
        onSend={sendMessage} 
        disabled={isStreaming || !isConnected}
        context={{currentDatabase, currentCluster}}
      />
      {error && <ChatError error={error} />}
    </div>
  );
};
```

#### 2. ChatMessage Component

**Location:** `src/features/chat/components/ChatMessage/ChatMessage.tsx`

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  isStreaming?: boolean;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface ToolResult {
  toolCallId: string;
  result: any;
  error?: string;
}

export const ChatMessage: React.FC<{message: ChatMessage}> = ({message}) => {
  const renderContent = () => {
    switch (message.role) {
      case 'user':
        return <UserMessage content={message.content} />;
      case 'assistant':
        return (
          <AssistantMessage 
            content={message.content}
            toolCalls={message.toolCalls}
            isStreaming={message.isStreaming}
          />
        );
      case 'tool':
        return <ToolMessage result={message.toolResults?.[0]} />;
    }
  };

  return (
    <div className={b('message', {role: message.role})}>
      <div className={b('message-avatar')}>
        {message.role === 'assistant' ? <RobotIcon /> : <UserIcon />}
      </div>
      <div className={b('message-content')}>
        {renderContent()}
        <div className={b('message-timestamp')}>
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
};
```

#### 3. useEventSource Hook

**Location:** `src/features/chat/hooks/useEventSource.ts`

```typescript
interface EventSourceOptions {
  onMessage: (data: any) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useEventSource(
  url: string | null,
  options: EventSourceOptions
) {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const connect = useCallback(() => {
    if (!url || eventSourceRef.current) return;

    abortControllerRef.current = new AbortController();
    const eventSource = new EventSource(url, {
      withCredentials: true
    });

    eventSource.onopen = () => {
      setIsConnected(true);
      setReconnectAttempts(0);
      options.onOpen?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        options.onMessage(data);
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      setIsConnected(false);
      options.onError?.(error);
      
      // Implement exponential backoff for reconnection
      if (reconnectAttempts < (options.maxReconnectAttempts || 5)) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);
      }
    };

    eventSourceRef.current = eventSource;
  }, [url, options, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (url) {
      connect();
    }
    return disconnect;
  }, [url, connect, disconnect]);

  return {
    isConnected,
    disconnect,
    reconnect: connect
  };
}
```

#### 4. useChatStream Hook

**Location:** `src/features/chat/hooks/useChatStream.ts`

```typescript
export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>('');
  
  const { isConnected, disconnect } = useEventSource(
    isStreaming ? '/api/chat/stream' : null,
    {
      onMessage: handleStreamMessage,
      onError: handleStreamError,
      onOpen: () => console.log('Chat stream connected'),
    }
  );

  const handleStreamMessage = useCallback((data: ChatDelta) => {
    if (data.error) {
      setIsStreaming(false);
      // Handle error
      return;
    }

    if (data.content) {
      setCurrentStreamingMessage(prev => prev + data.content);
    }

    if (data.tool_calls) {
      // Handle tool calls
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: currentStreamingMessage,
        timestamp: Date.now(),
        toolCalls: data.tool_calls
      }]);
    }

    if (data.finish_reason === 'stop') {
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: currentStreamingMessage,
        timestamp: Date.now()
      }]);
      setCurrentStreamingMessage('');
      setIsStreaming(false);
    }
  }, [currentStreamingMessage]);

  const sendMessage = useCallback(async (content: string, context?: any) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
            tool_calls: msg.toolCalls,
            tool_call_id: msg.role === 'tool' ? msg.toolResults?.[0]?.toolCallId : undefined
          })),
          context
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setIsStreaming(false);
      console.error('Failed to send message:', error);
    }
  }, [messages]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setCurrentStreamingMessage('');
    setIsStreaming(false);
    disconnect();
  }, [disconnect]);

  return {
    messages: isStreaming ? 
      [...messages, {
        id: 'streaming',
        role: 'assistant' as const,
        content: currentStreamingMessage,
        timestamp: Date.now(),
        isStreaming: true
      }] : 
      messages,
    sendMessage,
    clearHistory,
    isStreaming,
    isConnected
  };
}
```

### Backend Implementation

#### 1. Express Server Setup

**Location:** `backend/src/server.ts`

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { chatRouter } from './routes/chat';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow SSE
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
app.use('/chat', rateLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/chat', chatRouter);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`Chat agent server running on port ${PORT}`);
});
```

#### 2. Chat Route Handler

**Location:** `backend/src/routes/chat.ts`

```typescript
import { Router } from 'express';
import { OpenAI } from 'openai';
import { MCPService } from '../services/mcp';
import { StreamingService } from '../services/streaming';

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.ELIZA_API_KEY,
  baseURL: process.env.ELIZA_BASE_URL || 'https://api.eliza.yandex.net/raw/openai/v1'
});

const mcpService = new MCPService();
const streamingService = new StreamingService();

router.post('/', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    const { messages, context } = req.body;
    
    // Get available MCP tools
    const tools = await mcpService.listTools();
    
    // Enhance messages with YDB context
    const enhancedMessages = await enhanceMessagesWithContext(messages, context);
    
    // Create OpenAI stream
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: enhancedMessages,
      stream: true,
      tools: tools.map(formatToolForOpenAI),
      tool_choice: 'auto'
    });

    // Handle streaming response
    await streamingService.handleStream(stream, res, {
      onToolCall: async (toolCall) => {
        const result = await mcpService.invokeTool(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );
        return result;
      },
      onError: (error) => {
        console.error('Streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
  } finally {
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

async function enhanceMessagesWithContext(messages: any[], context: any) {
  const systemMessage = {
    role: 'system',
    content: `You are a YDB database assistant. Current context:
    - Database: ${context?.currentDatabase || 'unknown'}
    - Cluster: ${context?.currentCluster || 'unknown'}
    - User permissions: ${context?.userPermissions || 'read-only'}
    
    You can help with:
    - Database queries and schema exploration
    - Performance analysis and optimization
    - Cluster monitoring and health checks
    - Access control management
    
    Always use the available MCP tools to get real-time data from YDB.`
  };

  return [systemMessage, ...messages];
}

function formatToolForOpenAI(tool: any) {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
  };
}

export { router as chatRouter };
```

#### 3. MCP Service

**Location:** `backend/src/services/mcp.ts`

```typescript
import { Client as MCPClient } from '@modelcontextprotocol/sdk';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/transport/sse';

export class MCPService {
  private client: MCPClient;
  private isConnected = false;
  private tools: any[] = [];

  constructor() {
    this.client = new MCPClient({
      name: 'ydb-chat-agent',
      version: '1.0.0'
    });
  }

  async connect() {
    if (this.isConnected) return;

    try {
      const transport = new SSEServerTransport(
        process.env.MCP_SERVER_URL || 'http://ui-dev-0.ydb.yandex.net:8784/meta/mcp'
      );
      
      await this.client.connect(transport);
      this.isConnected = true;
      
      // Cache available tools
      await this.refreshTools();
      
      console.log('MCP client connected successfully');
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      throw error;
    }
  }

  async refreshTools() {
    try {
      const response = await this.client.listTools();
      this.tools = response.tools || [];
      console.log(`Loaded ${this.tools.length} MCP tools`);
    } catch (error) {
      console.error('Failed to refresh MCP tools:', error);
      this.tools = [];
    }
  }

  async listTools() {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.tools;
  }

  async invokeTool(name: string, args: any) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const result = await this.client.invoke(name, args);
      return result;
    } catch (error) {
      console.error(`Failed to invoke tool ${name}:`, error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}
```

#### 4. Streaming Service

**Location:** `backend/src/services/streaming.ts`

```typescript
import { Response } from 'express';

interface StreamingOptions {
  onToolCall?: (toolCall: any) => Promise<any>;
  onError?: (error: Error) => void;
}

export class StreamingService {
  async handleStream(
    stream: AsyncIterable<any>,
    res: Response,
    options: StreamingOptions = {}
  ) {
    let currentToolCalls: any[] = [];
    let currentMessage = '';

    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const finishReason = chunk.choices[0]?.finish_reason;

        if (delta?.content) {
          currentMessage += delta.content;
          res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
        }

        if (delta?.tool_calls) {
          currentToolCalls.push(...delta.tool_calls);
          res.write(`data: ${JSON.stringify({ tool_calls: delta.tool_calls })}\n\n`);
        }

        if (finishReason === 'tool_calls' && options.onToolCall) {
          // Handle tool calls
          const toolResults = await Promise.all(
            currentToolCalls.map(async (toolCall) => {
              try {
                const result = await options.onToolCall!(toolCall);
                return {
                  toolCallId: toolCall.id,
                  result,
                  error: null
                };
              } catch (error) {
                return {
                  toolCallId: toolCall.id,
                  result: null,
                  error: error.message
                };
              }
            })
          );

          // Send tool results
          res.write(`data: ${JSON.stringify({ tool_results: toolResults })}\n\n`);

          // Continue conversation with tool results
          await this.continueWithToolResults(
            currentMessage,
            currentToolCalls,
            toolResults,
            res
          );
        }

        if (finishReason === 'stop') {
          res.write(`data: ${JSON.stringify({ finish_reason: 'stop' })}\n\n`);
          break;
        }
      }
    } catch (error) {
      options.onError?.(error);
      throw error;
    }
  }

  private async continueWithToolResults(
    message: string,
    toolCalls: any[],
    toolResults: any[],
    res: Response
  ) {
    // Implementation for continuing conversation after tool calls
    // This would create a new OpenAI request with the tool results
    // and stream the follow-up response
  }
}
```

### Redux Integration

#### Chat Slice

**Location:** `src/features/chat/store/chatSlice.ts`

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isStreaming: boolean;
  isConnected: boolean;
  error: string | null;
  settings: {
    autoScroll: boolean;
    showTimestamps: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
}

const initialState: ChatState = {
  isOpen: false,
  messages: [],
  isStreaming: false,
  isConnected: false,
  error: null,
  settings: {
    autoScroll: true,
    showTimestamps: true,
    theme: 'auto'
  }
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    togglePanel: (state) => {
      state.isOpen = !state.isOpen;
    },
    openPanel: (state) => {
      state.isOpen = true;
    },
    closePanel: (state) => {
      state.isOpen = false;
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    updateStreamingMessage: (state, action: PayloadAction<string>) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage.isStreaming) {
        lastMessage.content += action.payload;
      }
    },
    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    updateSettings: (state, action: PayloadAction<Partial<ChatState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    }
  }
});

export const {
  togglePanel,
  openPanel,
  closePanel,
  addMessage,
  updateStreamingMessage,
  setStreaming,
  setConnected,
  setError,
  clearMessages,
  updateSettings
} = chatSlice.actions;

export default chatSlice.reducer;
```

This technical specification provides detailed implementation guidance for all major components of the chat assistant integration, following the existing patterns and architecture of the YDB embedded UI project.