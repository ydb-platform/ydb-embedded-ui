import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChatAPI } from '../api/chatApi';
import { chatActions } from '../store/chatSlice';
import { ChatMessage, ChatDelta } from '../types/chat';
import { usePageContext } from '../utils/pageContext';

export function useChat() {
    const dispatch = useDispatch();
    const { messages, isLoading, isStreaming, error, isOpen } = useSelector(
        (state: any) => state.chat
    );
    const abortControllerRef = useRef<AbortController | null>(null);
    const pageContext = usePageContext();

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
            // Use smart page context extraction
            const context = {
                url: window.location.href,
                pathname: window.location.pathname,
                search: window.location.search,
                hash: window.location.hash,
                params: {
                    pageType: pageContext.pageType,
                    ...(pageContext.clusterName && { clusterName: pageContext.clusterName }),
                    ...(pageContext.database && { database: pageContext.database }),
                    ...(pageContext.entityId && { entityId: pageContext.entityId }),
                    ...(pageContext.activeTab && { activeTab: pageContext.activeTab }),
                    ...(pageContext.nodeId && { nodeId: pageContext.nodeId }),
                    ...(pageContext.tabletId && { tabletId: pageContext.tabletId }),
                },
                description: pageContext.description
            };

            await ChatAPI.sendMessage(
                allMessages,
                (delta: ChatDelta) => {
                    dispatch(chatActions.processDelta(delta));
                },
                (error: Error) => {
                    dispatch(chatActions.setError(error.message));
                },
                abortControllerRef.current.signal,
                context
            );
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                dispatch(chatActions.setError(error.message));
            }
        }
    }, [dispatch, messages, isLoading, pageContext]);

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
