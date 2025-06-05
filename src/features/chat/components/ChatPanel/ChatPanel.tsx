import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, ActionTooltip, Icon, Text } from '@gravity-ui/uikit';
import { Drawer, DrawerItem } from '@gravity-ui/navigation';
import { Xmark } from '@gravity-ui/icons';
import { ChatMessage } from '../ChatMessage/ChatMessage';
import { ChatInput } from '../ChatInput/ChatInput';
import { useChat } from '../../hooks/useChat';
import { ChatState } from '../../types/chat';
import { cn } from '../../../../utils/cn';
import './ChatPanel.scss';

const b = cn('ydb-chat-drawer');

export const ChatPanel: React.FC = () => {
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
        if (messagesEndRef.current) {
            const messagesContainer = messagesEndRef.current.parentElement;
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    };

    useEffect(() => {
        // Use setTimeout to ensure DOM has updated
        const timer = setTimeout(() => {
            scrollToBottom();
        }, 0);
        
        return () => clearTimeout(timer);
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

    const [drawerWidth, setDrawerWidth] = useState(() => {
        const savedWidth = localStorage.getItem('chat-drawer-width');
        return savedWidth ? Number(savedWidth) : 400;
    });

    const handleResizeDrawer = (width: number) => {
        setDrawerWidth(width);
        localStorage.setItem('chat-drawer-width', width.toString());
    };

    return (
        <Drawer
            onEscape={closeChat}
            onVeilClick={closeChat}
            hideVeil
            className={b('container')}
        >
            <DrawerItem
                id="chat-drawer"
                visible={isOpen}
                resizable
                width={drawerWidth}
                onResize={handleResizeDrawer}
                direction="right"
                className={b('item')}
            >
                {/* Header */}
                <div className={b('header')}>
                    <Text variant="subheader-2">AI Assistant</Text>
                    <div className={b('controls')}>
                        <ActionTooltip title="Clear history (⌘K)">
                            <Button
                                view="flat"
                                size="s"
                                onClick={handleClearHistory}
                                disabled={messages.length === 0}
                            >
                                🗑
                            </Button>
                        </ActionTooltip>
                        <ActionTooltip title="Close">
                            <Button view="flat" size="s" onClick={closeChat}>
                                <Icon data={Xmark} size={16} />
                            </Button>
                        </ActionTooltip>
                    </div>
                </div>

                {/* Messages */}
                <div className={b('messages')}>
                    {messages.length === 0 && (
                        <div className={b('welcome')}>
                            <h4>Welcome to YDB AI Assistant</h4>
                            <p>Ask questions about your YDB cluster, databases, or get help with queries.</p>
                            <div className={b('suggestions')}>
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
                        <div className={b('error')}>
                            <span className={b('error-icon')}>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className={b('input')}>
                    <ChatInput
                        onSendMessage={handleSendMessage}
                        disabled={isLoading}
                        isStreaming={isStreaming}
                        onStopGeneration={stopGeneration}
                    />
                </div>
            </DrawerItem>
        </Drawer>
    );
};
