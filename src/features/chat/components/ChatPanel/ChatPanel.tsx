import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@gravity-ui/uikit';
import { ChatMessage } from '../ChatMessage/ChatMessage';
import { ChatInput } from '../ChatInput/ChatInput';
import { useChat } from '../../hooks/useChat';
import { ChatState } from '../../types/chat';
import './ChatPanel.scss';

interface ChatPanelProps {
    className?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ className }) => {
    const { messages, isLoading, isStreaming, error, isOpen } = useSelector(
        (state: { chat: ChatState }) => state.chat
    );
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const { 
        sendMessage, 
        stopGeneration, 
        clearHistory, 
        closeChat 
    } = useChat();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (content: string) => {
        await sendMessage(content);
    };

    const handleClearHistory = () => {
        clearHistory();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.metaKey && event.key === 'k') {
            event.preventDefault();
            handleClearHistory();
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
        return;
    }, [isOpen]);

    return (
        <div className={`chat-panel ${isOpen ? 'chat-panel--open' : ''} ${className || ''}`}>
            <div className="chat-panel__header">
                <h3 className="chat-panel__title">
                    AI Assistant
                </h3>
                <div className="chat-panel__actions">
                    <Button
                        view="flat"
                        size="s"
                        onClick={handleClearHistory}
                        disabled={messages.length === 0}
                        title="Clear history (⌘K)"
                    >
                        🗑
                    </Button>
                    <Button
                        view="flat"
                        size="s"
                        onClick={closeChat}
                        title="Close"
                    >
                        ✕
                    </Button>
                </div>
            </div>

            <div className="chat-panel__messages">
                {messages.length === 0 && (
                    <div className="chat-panel__welcome">
                        <h4>Welcome to YDB AI Assistant</h4>
                        <p>Ask questions about your YDB cluster, databases, or get help with queries.</p>
                        <div className="chat-panel__suggestions">
                            <Button
                                view="outlined"
                                size="s"
                                onClick={() => handleSendMessage('Show me cluster health status')}
                            >
                                Check cluster health
                            </Button>
                            <Button
                                view="outlined"
                                size="s"
                                onClick={() => handleSendMessage('List all databases')}
                            >
                                List databases
                            </Button>
                            <Button
                                view="outlined"
                                size="s"
                                onClick={() => handleSendMessage('Help me write a YQL query')}
                            >
                                Help with queries
                            </Button>
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                ))}

                {error && (
                    <div className="chat-panel__error">
                        <span className="chat-panel__error-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="chat-panel__input">
                <ChatInput
                    onSendMessage={handleSendMessage}
                    disabled={isLoading}
                    isStreaming={isStreaming}
                    onStopGeneration={stopGeneration}
                />
            </div>
        </div>
    );
};