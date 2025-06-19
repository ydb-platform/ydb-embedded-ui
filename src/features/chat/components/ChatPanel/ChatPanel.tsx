import React from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Drawer, DrawerItem} from '@gravity-ui/navigation';
import {ActionTooltip, Button, Icon, Text} from '@gravity-ui/uikit';
import {useSelector} from 'react-redux';

import {cn} from '../../../../utils/cn';
import {useChat} from '../../hooks/useChat';
import {formatContextForAI, useCurrentContext} from '../../services/contextService';
import type {ChatState} from '../../types/chat';
import {ChatInput} from '../ChatInput/ChatInput';
import {ChatMessage} from '../ChatMessage/ChatMessage';
import {QuotaDisplay} from '../QuotaDisplay';

import './ChatPanel.scss';

const b = cn('ydb-chat-drawer');

export const ChatPanel = () => {
    const {messages, isLoading, isStreaming, error, isOpen} = useSelector(
        (state: {chat: ChatState}) => state.chat,
    );
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const [quotaRefreshTrigger, setQuotaRefreshTrigger] = React.useState(0);

    const {sendMessage, stopGeneration, clearHistory, closeChat} = useChat();
    const context = useCurrentContext();

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            const messagesContainer = messagesEndRef.current.parentElement;
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    };

    React.useEffect(() => {
        // Use setTimeout to ensure DOM has updated
        const timer = setTimeout(() => {
            scrollToBottom();
        }, 0);

        return () => clearTimeout(timer);
    }, [messages]);

    // Update quota after chat completion
    React.useEffect(() => {
        // When streaming stops and loading is complete, refresh quota
        if (!isStreaming && !isLoading && messages.length > 0) {
            // Add a small delay to ensure the message is fully processed
            const timer = setTimeout(() => {
                setQuotaRefreshTrigger((prev) => prev + 1);
            }, 500);

            return () => clearTimeout(timer);
        }
        return undefined;
    }, [isStreaming, isLoading, messages.length]);

    const handleSendMessage = async (content: string) => {
        const contextString = formatContextForAI(context);
        await sendMessage(content, contextString);
    };

    const handleClearHistory = React.useCallback(() => {
        clearHistory();
    }, [clearHistory]);

    const handleKeyDown = React.useCallback(
        (event: KeyboardEvent) => {
            if (event.metaKey && event.key === 'k') {
                event.preventDefault();
                handleClearHistory();
            }
        },
        [handleClearHistory],
    );

    React.useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
        return undefined;
    }, [handleKeyDown, isOpen]);

    const [drawerWidth, setDrawerWidth] = React.useState(() => {
        const savedWidth = localStorage.getItem('chat-drawer-width');
        return savedWidth ? Number(savedWidth) : 400;
    });

    const handleResizeDrawer = (width: number) => {
        setDrawerWidth(width);
        localStorage.setItem('chat-drawer-width', width.toString());
    };

    return (
        <Drawer onEscape={closeChat} onVeilClick={closeChat} hideVeil className={b('container')}>
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
                    <div className={b('header-left')}>
                        <Text variant="subheader-2">AI Ассистент</Text>
                        <QuotaDisplay compact refreshTrigger={quotaRefreshTrigger} />
                    </div>
                    <div className={b('controls')}>
                        <ActionTooltip title="Очистить историю (⌘K)">
                            <Button
                                view="flat"
                                size="s"
                                onClick={handleClearHistory}
                                disabled={
                                    messages.filter((msg) => msg.role !== 'tool').length === 0
                                }
                            >
                                🗑
                            </Button>
                        </ActionTooltip>
                        <ActionTooltip title="Закрыть">
                            <Button view="flat" size="s" onClick={closeChat}>
                                <Icon data={Xmark} size={16} />
                            </Button>
                        </ActionTooltip>
                    </div>
                </div>

                {/* Messages */}
                <div className={b('messages')}>
                    {messages.filter((msg) => msg.role !== 'tool').length === 0 && (
                        <div className={b('welcome')}>
                            <h4>Добро пожаловать в YDB AI Ассистент</h4>
                            <p>
                                Задавайте вопросы о состоянии кластера, базах данных или получите
                                помощь с запросами.
                            </p>
                            <div className={b('suggestions')}>
                                <Button
                                    view="outlined"
                                    size="s"
                                    onClick={() => handleSendMessage('Покажи состояние кластера')}
                                >
                                    Состояние кластера
                                </Button>
                                <Button
                                    view="outlined"
                                    size="s"
                                    onClick={() => handleSendMessage('Какие есть базы данных?')}
                                >
                                    Список БД
                                </Button>
                                <Button
                                    view="outlined"
                                    size="s"
                                    onClick={() => handleSendMessage('Есть ли проблемы с нодами?')}
                                >
                                    Проверить ноды
                                </Button>
                                <Button
                                    view="outlined"
                                    size="s"
                                    onClick={() =>
                                        handleSendMessage(
                                            'Помоги написать YQL запрос для выборки данных',
                                        )
                                    }
                                >
                                    Помощь с YQL
                                </Button>
                                <Button
                                    view="outlined"
                                    size="s"
                                    onClick={() =>
                                        handleSendMessage('Покажи топ медленных запросов')
                                    }
                                >
                                    Медленные запросы
                                </Button>
                                <Button
                                    view="outlined"
                                    size="s"
                                    onClick={() =>
                                        handleSendMessage('Сколько места занимают таблицы?')
                                    }
                                >
                                    Размер таблиц
                                </Button>
                            </div>
                        </div>
                    )}

                    {messages
                        .filter((message) => message.role !== 'tool')
                        .map((message) => (
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
