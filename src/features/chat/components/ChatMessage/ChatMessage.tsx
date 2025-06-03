import React from 'react';
import { Button, Icon } from '@gravity-ui/uikit';
import { ChatMessage as ChatMessageType } from '../../types/chat';
import './ChatMessage.scss';

// Icons - these would need to be imported from your icon library
const UserIcon = () => <span>👤</span>;
const AssistantIcon = () => <span>🤖</span>;
const ToolIcon = () => <span>🔧</span>;
const CopyIcon = () => <span>📋</span>;

interface ChatMessageProps {
    message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const handleCopyContent = () => {
        navigator.clipboard.writeText(message.content);
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const renderToolCalls = () => {
        if (!message.toolCalls || message.toolCalls.length === 0) return null;

        return (
            <div className="chat-message__tool-calls">
                {message.toolCalls.map((toolCall) => (
                    <div key={toolCall.id} className="chat-message__tool-call">
                        <div className="chat-message__tool-header">
                            <Icon data={ToolIcon} />
                            <span className="chat-message__tool-name">
                                {toolCall.function.name}
                            </span>
                        </div>
                        <div className="chat-message__tool-args">
                            <pre>{JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2)}</pre>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderUsageInfo = () => {
        if (!message.metadata?.usage) return null;

        const { usage } = message.metadata;
        return (
            <div className="chat-message__usage">
                <span>Tokens: {usage.totalTokens} ({usage.promptTokens} + {usage.completionTokens})</span>
            </div>
        );
    };

    const getMessageIcon = () => {
        switch (message.role) {
            case 'user':
                return <Icon data={UserIcon} />;
            case 'assistant':
                return <Icon data={AssistantIcon} />;
            case 'tool':
                return <Icon data={ToolIcon} />;
            default:
                return null;
        }
    };

    const getMessageClass = () => {
        return `chat-message chat-message--${message.role}`;
    };

    return (
        <div className={getMessageClass()}>
            <div className="chat-message__header">
                <div className="chat-message__avatar">
                    {getMessageIcon()}
                </div>
                <div className="chat-message__meta">
                    <span className="chat-message__role">
                        {message.role === 'user' ? 'You' :
                         message.role === 'tool' ? 'Tool Result' : 'Assistant'}
                    </span>
                    <span className="chat-message__timestamp">
                        {formatTimestamp(message.timestamp)}
                    </span>
                </div>
                <div className="chat-message__actions">
                    <Button
                        view="flat"
                        size="xs"
                        onClick={handleCopyContent}
                        title="Copy message"
                    >
                        <Icon data={CopyIcon} />
                    </Button>
                </div>
            </div>

            <div className="chat-message__content">
                {message.content && (
                    <div className="chat-message__text">
                        {message.content.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                                {line}
                                {index < message.content.split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {renderToolCalls()}
                {renderUsageInfo()}
            </div>
        </div>
    );
};