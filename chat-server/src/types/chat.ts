export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

export interface ChatCompletionRequest {
    messages: Array<{
        role: string;
        content: string;
        tool_calls?: ToolCall[];
        tool_call_id?: string;
    }>;
    stream?: boolean;
    model?: string;
    temperature?: number;
    max_tokens?: number;
}


export interface StreamingChatResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        delta: {
            role?: string;
            content?: string;
            tool_calls?: ToolCall[];
        };
        finish_reason?: string;
    }>;
}
