export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    timestamp: number;
    toolCalls?: ToolCall[];
    toolCallId?: string;
    metadata?: {
        model?: string;
        usage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
    };
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

export interface ChatDelta {
    type: 'content' | 'tool_call' | 'tool_executing' | 'tool_result' | 'tool_error' | 'done' | 'error';
    content?: string;
    tool_calls?: ToolCall[];
    tool_name?: string;
    tool_id?: string;
    result?: any;
    error?: string;
}

export interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;
    isStreaming: boolean;
    error: string | null;
    sessionId: string | null;
    availableTools: MCPTool[];
    isOpen: boolean;
}

export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
}

export interface ChatRequest {
    messages: Array<{
        role: string;
        content: string;
        tool_calls?: ToolCall[];
        tool_call_id?: string;
    }>;
    stream: boolean;
    model: string;
}