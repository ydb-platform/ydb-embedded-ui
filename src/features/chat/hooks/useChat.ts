import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChatAPI } from '../api/chatApi';
import { chatActions } from '../store/chatSlice';
import { ChatMessage, ChatDelta } from '../types/chat';

export function useChat() {
    const dispatch = useDispatch();
    const { messages, isLoading, isStreaming, error, isOpen } = useSelector(
        (state: any) => state.chat
    );
    const abortControllerRef = useRef<AbortController | null>(null);

    const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return;

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
            await ChatAPI.sendMessage(
                allMessages,
                (delta: ChatDelta) => {
                    dispatch(chatActions.processDelta(delta));
                },
                (error: Error) => {
                    dispatch(chatActions.setError(error.message));
                },
                abortControllerRef.current.signal
            );
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                dispatch(chatActions.setError(error.message));
            }
        }
    }, [dispatch, messages, isLoading]);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        dispatch(chatActions.stopStreaming());
    }, [dispatch]);

    const clearHistory = useCallback(() => {
        dispatch(chatActions.clearMessages());
    }, [dispatch]);

    const retryLastMessage = useCallback(() => {
        if (messages.length === 0) return;

        // Find the last user message
        const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
        if (lastUserMessage) {
            // Remove messages after the last user message
            const userMessageIndex = messages.findIndex((msg: ChatMessage) => msg.id === lastUserMessage.id);
            const messagesToKeep = messages.slice(0, userMessageIndex + 1);
            
            dispatch(chatActions.clearMessages());
            messagesToKeep.forEach((msg: ChatMessage) => dispatch(chatActions.addMessage(msg)));
            
            // Resend the message
            sendMessage(lastUserMessage.content);
        }
    }, [messages, sendMessage, dispatch]);

    const openChat = useCallback(() => {
        dispatch(chatActions.openChat());
    }, [dispatch]);

    const closeChat = useCallback(() => {
        dispatch(chatActions.closeChat());
    }, [dispatch]);

    const toggleChat = useCallback(() => {
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