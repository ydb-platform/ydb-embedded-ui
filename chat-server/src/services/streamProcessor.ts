
export interface StreamResult {
    accumulatedContent: string;
    completeToolCalls: any[];
}

export class StreamProcessor {
    private accumulatedContent = '';
    private toolCallsMap = new Map<string, any>();

    /**
     * Process streaming response from LLM and accumulate content and tool calls
     */
    async processStream(
        stream: AsyncIterable<any>, 
        onData: (data: string) => void
    ): Promise<StreamResult> {
        // Reset state for new stream
        this.accumulatedContent = '';
        this.toolCallsMap.clear();

        // Process streaming response
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            if (!delta) continue;

            // Handle content delta
            if (delta.content) {
                this.handleContentDelta(delta.content, onData);
            }

            // Handle tool calls delta
            if (delta.tool_calls) {
                this.handleToolCallsDelta(delta.tool_calls);
            }
        }

        return {
            accumulatedContent: this.accumulatedContent,
            completeToolCalls: this.getCompleteToolCalls()
        };
    }

    /**
     * Handle content delta from streaming response
     */
    private handleContentDelta(content: string, onData: (data: string) => void): void {
        this.accumulatedContent += content;
        onData(`data: ${JSON.stringify({
            type: 'content',
            content: content,
        })}\n\n`);
    }

    /**
     * Handle tool calls delta and accumulate them
     */
    private handleToolCallsDelta(toolCalls: any[]): void {
        for (const toolCall of toolCalls) {
            this.accumulateToolCall(toolCall);
        }
    }

    /**
     * Accumulate individual tool call data
     */
    private accumulateToolCall(toolCall: any): void {
        // Use index as the key for grouping, fallback to id if no index
        const key = toolCall.index !== undefined ? `index_${toolCall.index}` : toolCall.id;
        
        if (!key || !toolCall.function) {
            return;
        }

        // Get existing tool call or create new one
        const existing = this.toolCallsMap.get(key) || { 
            id: toolCall.id || `generated_${toolCall.index}`,
            index: toolCall.index 
        };
        
        // Update ID if provided
        if (toolCall.id) {
            existing.id = toolCall.id;
        }
        
        // Update function name
        if (toolCall.function.name) {
            existing.function = existing.function || {};
            existing.function.name = toolCall.function.name;
        }
        
        // Accumulate function arguments
        if (toolCall.function.arguments !== undefined) {
            existing.function = existing.function || {};
            const oldArgs = existing.function.arguments || '';
            existing.function.arguments = oldArgs + toolCall.function.arguments;
        }
        
        this.toolCallsMap.set(key, existing);
    }

    /**
     * Get complete tool calls that have function names
     */
    private getCompleteToolCalls(): any[] {
        return Array.from(this.toolCallsMap.values()).filter(
            (toolCall: any) => toolCall.function?.name
        );
    }

    /**
     * Get current accumulated content (for debugging)
     */
    getAccumulatedContent(): string {
        return this.accumulatedContent;
    }

    /**
     * Get current tool calls map (for debugging)
     */
    getToolCallsMap(): Map<string, any> {
        return new Map(this.toolCallsMap);
    }
}
