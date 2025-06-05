import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage, ChatState, ChatDelta } from '../types/chat';

const initialState: ChatState = {
    messages: [],
    isLoading: false,
    isStreaming: false,
    error: null,
    sessionId: null,
    isOpen: false,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        // Panel state
        openChat: (state) => {
            state.isOpen = true;
        },
        closeChat: (state) => {
            state.isOpen = false;
        },
        toggleChat: (state) => {
            state.isOpen = !state.isOpen;
        },

        // Message management
        addMessage: (state, action: PayloadAction<ChatMessage>) => {
            state.messages.push(action.payload);
        },
        updateMessage: (state, action: PayloadAction<{ id: string; content: string }>) => {
            const message = state.messages.find(msg => msg.id === action.payload.id);
            if (message) {
                message.content = action.payload.content;
            }
        },
        clearMessages: (state) => {
            state.messages = [];
            state.error = null;
            state.needsNewAssistantMessage = false;
            state.currentStreamingMessageId = undefined;
        },

        // Streaming state
        startStreaming: (state) => {
            state.isStreaming = true;
            state.isLoading = true;
            state.error = null;
            // Mark that we need a new assistant message for this streaming session
            state.needsNewAssistantMessage = true;
        },
        stopStreaming: (state) => {
            state.isStreaming = false;
            state.isLoading = false;
            state.needsNewAssistantMessage = false;
        },
        
        // Handle streaming deltas
        processDelta: (state, action: PayloadAction<ChatDelta>) => {
            const delta = action.payload;
            console.log('Processing delta:', delta);
            
            switch (delta.type) {
                case 'content':
                    // Find or create the current streaming assistant message
                    let assistantMessage: ChatMessage | undefined;
                    
                    // If we need a new assistant message or there's no current streaming message
                    if (state.needsNewAssistantMessage || !state.currentStreamingMessageId) {
                        assistantMessage = {
                            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            role: 'assistant',
                            content: '',
                            timestamp: Date.now(),
                        };
                        state.messages.push(assistantMessage);
                        state.currentStreamingMessageId = assistantMessage.id;
                        state.needsNewAssistantMessage = false;
                    } else {
                        // Find the current streaming message
                        assistantMessage = state.messages.find(msg => msg.id === state.currentStreamingMessageId);
                        if (!assistantMessage) {
                            // Fallback: create new message if current streaming message not found
                            assistantMessage = {
                                id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                role: 'assistant',
                                content: '',
                                timestamp: Date.now(),
                            };
                            state.messages.push(assistantMessage);
                            state.currentStreamingMessageId = assistantMessage.id;
                        }
                    }

                    // Update content
                    if (delta.content) {
                        assistantMessage.content += delta.content;
                    }
                    break;

                case 'tool_call':
                    // Find the last assistant message that's being streamed
                    let toolMessage = state.isStreaming
                        ? state.messages.filter(msg => msg.role === 'assistant').pop()
                        : undefined;

                    if (!toolMessage) {
                        toolMessage = {
                            id: `msg-${Date.now()}`,
                            role: 'assistant',
                            content: '',
                            timestamp: Date.now(),
                        };
                        state.messages.push(toolMessage);
                    }

                    if (delta.tool_calls) {
                        if (!toolMessage.toolCalls) {
                            toolMessage.toolCalls = [];
                        }
                        toolMessage.toolCalls.push(...delta.tool_calls);
                    }
                    break;

                case 'tool_executing':
                    // Just log that tool is executing, don't add a message
                    console.log('Tool executing:', delta.tool_name, delta.tool_id);
                    break;

                case 'tool_result':
                    // Add tool result as a separate message
                    if (delta.tool_id && delta.result) {
                        console.log('Adding tool result message:', delta.tool_id, delta.result);
                        state.messages.push({
                            id: `tool-result-${Date.now()}`,
                            role: 'tool',
                            content: typeof delta.result === 'string' ? delta.result : JSON.stringify(delta.result, null, 2),
                            timestamp: Date.now(),
                            toolCallId: delta.tool_id,
                        });
                    }
                    break;

                case 'tool_error':
                    // Add tool error as a message
                    if (delta.error) {
                        state.messages.push({
                            id: `tool-error-${Date.now()}`,
                            role: 'assistant',
                            content: `Tool execution error: ${delta.error}`,
                            timestamp: Date.now(),
                        });
                    }
                    break;

                case 'done':
                    state.isStreaming = false;
                    state.isLoading = false;
                    state.currentStreamingMessageId = undefined;
                    state.needsNewAssistantMessage = false;
                    break;

                case 'error':
                    state.error = delta.error || 'Unknown error occurred';
                    state.isStreaming = false;
                    state.isLoading = false;
                    break;
            }
        },

        // Error handling
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isLoading = false;
            state.isStreaming = false;
        },
        clearError: (state) => {
            state.error = null;
        },


        // Session
        setSessionId: (state, action: PayloadAction<string>) => {
            state.sessionId = action.payload;
        },
    },
});

export const chatActions = chatSlice.actions;
export const chatReducer = chatSlice.reducer;
