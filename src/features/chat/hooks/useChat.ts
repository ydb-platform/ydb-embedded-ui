import React from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {chatActions} from '../store/chatSlice';
import type {ChatDelta, ChatMessage} from '../types/chat';

export function useChat() {
    const dispatch = useDispatch();
    const {messages, isLoading, isStreaming, error, isOpen} = useSelector(
        (state: any) => state.chat,
    );
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const sendMessage = React.useCallback(
        async (content: string, context?: string) => {
            if (!content.trim() || isLoading) {
                return;
            }

            // Create user message
            const userMessage: ChatMessage = {
                id: generateMessageId(),
                role: 'user',
                content: content.trim(),
                timestamp: Date.now(),
            };

            dispatch(chatActions.addMessage(userMessage));
            dispatch(chatActions.startStreaming());

            // Abort any existing request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();

            const allMessages = [...messages, userMessage];

            try {
                await window.api.aiAssist?.sendMessage(
                    allMessages,
                    (delta: ChatDelta) => {
                        dispatch(chatActions.processDelta(delta));
                    },
                    (error: Error) => {
                        dispatch(chatActions.setError(error.message));
                    },
                    abortControllerRef.current.signal,
                    context,
                );
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    dispatch(chatActions.setError(error.message));
                }
            }
        },
        [dispatch, messages, isLoading],
    );

    const stopGeneration = React.useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        dispatch(chatActions.stopStreaming());
    }, [dispatch]);

    const clearHistory = React.useCallback(() => {
        dispatch(chatActions.clearMessages());
    }, [dispatch]);

    const retryLastMessage = React.useCallback(() => {
        if (messages.length === 0) {
            return;
        }

        // Find the last user message
        const lastUserMessage = [...messages].reverse().find((msg) => msg.role === 'user');
        if (lastUserMessage) {
            // Remove messages after the last user message
            const userMessageIndex = messages.findIndex(
                (msg: ChatMessage) => msg.id === lastUserMessage.id,
            );
            const messagesToKeep = messages.slice(0, userMessageIndex + 1);

            dispatch(chatActions.clearMessages());
            messagesToKeep.forEach((msg: ChatMessage) => dispatch(chatActions.addMessage(msg)));

            // Resend the message
            sendMessage(lastUserMessage.content);
        }
    }, [messages, sendMessage, dispatch]);

    const openChat = React.useCallback(() => {
        dispatch(chatActions.openChat());
    }, [dispatch]);

    const closeChat = React.useCallback(() => {
        dispatch(chatActions.closeChat());
    }, [dispatch]);

    const toggleChat = React.useCallback(() => {
        dispatch(chatActions.toggleChat());
    }, [dispatch]);

    return {
        messages,
        isLoading,
        isStreaming,
        error,
        isOpen,
        sendMessage,
        stopGeneration,
        clearHistory,
        retryLastMessage,
        openChat,
        closeChat,
        toggleChat,
    };
}
