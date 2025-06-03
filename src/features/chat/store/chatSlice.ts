import type {PayloadAction} from '@reduxjs/toolkit';
import {createSlice} from '@reduxjs/toolkit';

import type {ChatDelta, ChatMessage, ChatState} from '../types/chat';

// Helper functions to reduce complexity
const handleToolCalls = (state: ChatState, delta: ChatDelta) => {
    if (delta.tool_calls) {
        const toolCallsWithStatus = delta.tool_calls.map((tc: any) => ({
            ...tc,
            status: 'pending' as const,
            startTime: undefined,
            endTime: undefined,
        }));

        // Find the last assistant message
        for (let i = state.messages.length - 1; i >= 0; i--) {
            const message = state.messages[i];
            if (message && message.role === 'assistant') {
                // Initialize toolCalls array if it doesn't exist
                if (!message.toolCalls) {
                    message.toolCalls = [];
                }
                // Add new tool calls to existing ones
                message.toolCalls.push(...toolCallsWithStatus);
                break;
            }
        }
    }
};

const handleToolStatus = (state: ChatState, delta: ChatDelta) => {
    if (delta.tool_call_id && delta.tool_status) {
        for (let i = state.messages.length - 1; i >= 0; i--) {
            const message = state.messages[i];
            if (message.toolCalls) {
                const toolCall = message.toolCalls.find((tc) => tc.id === delta.tool_call_id);
                if (toolCall) {
                    toolCall.status = delta.tool_status;

                    if (delta.tool_status === 'executing' && !toolCall.startTime) {
                        toolCall.startTime = Date.now();
                    }

                    if (
                        (delta.tool_status === 'completed' || delta.tool_status === 'error') &&
                        !toolCall.endTime
                    ) {
                        toolCall.endTime = Date.now();
                    }

                    break;
                }
            }
        }
    }
};

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
        updateMessage: (state, action: PayloadAction<{id: string; content: string}>) => {
            const message = state.messages.find((msg) => msg.id === action.payload.id);
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

            switch (delta.type) {
                case 'content': {
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
                        assistantMessage = state.messages.find(
                            (msg) => msg.id === state.currentStreamingMessageId,
                        );
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
                }

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

                case 'tool_result': {
                    // Parse tool message from content and add to messages
                    if (delta.content) {
                        try {
                            const toolMessage = JSON.parse(delta.content) as ChatMessage;
                            state.messages.push(toolMessage);
                        } catch (error) {
                            console.warn('Failed to parse tool result:', error);
                        }
                    }
                    break;
                }

                case 'tool_calls': {
                    handleToolCalls(state, delta);
                    break;
                }

                case 'tool_status': {
                    handleToolStatus(state, delta);
                    break;
                }

                case 'usage': {
                    // Add usage data to the current assistant message
                    if (delta.usage && state.currentStreamingMessageId) {
                        const assistantMessage = state.messages.find(
                            (msg) => msg.id === state.currentStreamingMessageId,
                        );
                        if (assistantMessage) {
                            assistantMessage.usageBreakdown = delta.usage;
                        }
                    }
                    break;
                }
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
