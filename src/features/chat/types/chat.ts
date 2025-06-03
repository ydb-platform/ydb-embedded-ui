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
    usageBreakdown?: UsageBreakdown;
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
    status?: 'pending' | 'executing' | 'completed' | 'error';
    startTime?: number;
    endTime?: number;
}

export interface UsageBreakdown {
    mainChatTokens: number;
    summaryTokens: number;
    totalTokens: number;
    estimatedCost: number;
    breakdown: {
        mainChat: {
            inputTokens: number;
            outputTokens: number;
            cost: number;
        };
        summary: {
            inputTokens: number;
            outputTokens: number;
            cost: number;
        };
    };
}

export interface ChatDelta {
    type: 'content' | 'done' | 'error' | 'tool_result' | 'tool_calls' | 'tool_status' | 'usage';
    content?: string;
    error?: string;
    tool_calls?: any[];
    tool_call_id?: string;
    tool_status?: 'executing' | 'completed' | 'error';
    usage?: UsageBreakdown;
}

export interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;
    isStreaming: boolean;
    error: string | null;
    sessionId: string | null;
    isOpen: boolean;
    needsNewAssistantMessage?: boolean;
    currentStreamingMessageId?: string;
}

export interface ChatRequest {
    messages: Array<{
        role: string;
        content: string;
        tool_calls?: ToolCall[];
        tool_call_id?: string;
    }>;
    context?: string;
    stream: boolean;
    model: string;
}

export interface QuotaInfo {
    daily: {
        used: number;
        limit: number;
        percentage: number;
        remaining: number;
    };
    monthly: {
        used: number;
        limit: number;
        percentage: number;
        remaining: number;
    };
    pool: string;
    login: string;
}
