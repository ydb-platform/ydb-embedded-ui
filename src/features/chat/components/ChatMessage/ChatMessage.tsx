import React from 'react';

import {Button, Icon} from '@gravity-ui/uikit';

import type {ChatMessage as ChatMessageType} from '../../types/chat';
import {ToolCallBlock} from '../ToolCallBlock/ToolCallBlock';
import {UsageDisplay} from '../UsageDisplay/UsageDisplay';

import './ChatMessage.scss';

// Icons - these would need to be imported from your icon library
const UserIcon = () => <span>👤</span>;
const AssistantIcon = () => <span>🤖</span>;
const ToolIcon = () => <span>🔧</span>;
const CopyIcon = () => <span>📋</span>;

interface ChatMessageProps {
    message: ChatMessageType;
}

export const ChatMessage = ({message}: ChatMessageProps) => {
    const handleCopyContent = () => {
        navigator.clipboard.writeText(message.content);
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const formatToolResult = (content: string) => {
        try {
            const parsed = JSON.parse(content);

            // Handle MCP tool result format with content array
            let actualData = parsed;
            if (parsed.content && Array.isArray(parsed.content) && parsed.content.length > 0) {
                const contentItem = parsed.content[0];
                if (contentItem.text) {
                    try {
                        actualData = JSON.parse(contentItem.text);
                    } catch {
                        actualData = contentItem.text;
                    }
                }
            }

            // Special formatting for different types of results
            if (actualData.clusters && Array.isArray(actualData.clusters)) {
                return {
                    type: 'clusters',
                    data: actualData,
                    formatted: `🏢 Found ${actualData.clusters.length} clusters:\n\n${actualData.clusters
                        .map(
                            (cluster: any) =>
                                `• **${cluster.title || cluster.name}**\n  Environment: ${cluster.environment || 'unknown'}\n  Status: ${cluster.status || 'unknown'}\n  Owner: ${cluster.owner || 'unknown'}`,
                        )
                        .join('\n\n')}`,
                };
            }

            if (actualData.databases && Array.isArray(actualData.databases)) {
                return {
                    type: 'databases',
                    data: actualData,
                    formatted: `🗄️ Found ${actualData.databases.length} databases:\n\n${actualData.databases
                        .map(
                            (db: any) =>
                                `• **${db.name}**\n  Type: ${db.type || 'unknown'}\n  Status: ${db.status || 'unknown'}`,
                        )
                        .join('\n\n')}`,
                };
            }

            if (actualData.nodes && Array.isArray(actualData.nodes)) {
                return {
                    type: 'nodes',
                    data: actualData,
                    formatted: `🖥️ Found ${actualData.nodes.length} nodes:\n\n${actualData.nodes
                        .map(
                            (node: any) =>
                                `• **${node.host || node.id}**\n  Status: ${node.status || 'unknown'}\n  Load: ${node.load || 'unknown'}`,
                        )
                        .join('\n\n')}`,
                };
            }

            // Handle error responses
            if (parsed.isError === false && parsed.content) {
                return {
                    type: 'success',
                    data: parsed,
                    formatted: '✅ Tool executed successfully',
                };
            }

            if (parsed.isError === true) {
                return {
                    type: 'error',
                    data: parsed,
                    formatted: '❌ Tool execution failed',
                };
            }

            // For other structured data, show a summary
            if (typeof actualData === 'object' && actualData !== null) {
                const keys = Object.keys(actualData);
                if (keys.length > 0) {
                    return {
                        type: 'object',
                        data: actualData,
                        formatted: `📋 Result contains: ${keys.join(', ')}`,
                    };
                }
            }

            // If it's a string, show it directly
            if (typeof actualData === 'string') {
                return {
                    type: 'text',
                    data: actualData,
                    formatted: actualData,
                };
            }

            return {
                type: 'json',
                data: actualData,
                formatted: JSON.stringify(actualData, null, 2),
            };
        } catch {
            return {
                type: 'text',
                data: content,
                formatted: content,
            };
        }
    };

    const renderToolCalls = () => {
        if (!message.toolCalls || message.toolCalls.length === 0) {
            return null;
        }

        return <ToolCallBlock toolCalls={message.toolCalls} />;
    };

    const renderFormattedText = (text: string) => {
        // Split by double newlines to create paragraphs
        const paragraphs = text.split('\n\n');

        return paragraphs.map((paragraph, index) => {
            // Check if it's a header line (starts with emoji)
            const startsWithEmoji =
                paragraph.startsWith('🏢') ||
                paragraph.startsWith('🗄️') ||
                paragraph.startsWith('🖥️') ||
                paragraph.startsWith('📋') ||
                paragraph.startsWith('✅') ||
                paragraph.startsWith('❌');
            if (startsWithEmoji) {
                return (
                    <div key={index} className="chat-message__result-header">
                        {paragraph}
                    </div>
                );
            }

            // Process bullet points and bold text
            const lines = paragraph.split('\n');
            return (
                <div key={index} className="chat-message__result-section">
                    {lines.map((line, lineIndex) => {
                        if (line.startsWith('• **') && line.includes('**')) {
                            // Extract the bold part and the rest
                            const match = line.match(/^• \*\*(.*?)\*\*(.*)$/);
                            if (match) {
                                return (
                                    <div key={lineIndex} className="chat-message__result-item">
                                        <div className="chat-message__result-item-title">
                                            • <strong>{match[1]}</strong>
                                        </div>
                                        {match[2] && (
                                            <div className="chat-message__result-item-details">
                                                {match[2]}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        }

                        // Handle regular lines with indentation
                        if (
                            line.trim().startsWith('Environment:') ||
                            line.trim().startsWith('Status:') ||
                            line.trim().startsWith('Owner:') ||
                            line.trim().startsWith('Type:') ||
                            line.trim().startsWith('Load:')
                        ) {
                            return (
                                <div key={lineIndex} className="chat-message__result-detail">
                                    {line.trim()}
                                </div>
                            );
                        }

                        return line.trim() ? (
                            <div key={lineIndex} className="chat-message__result-line">
                                {line}
                            </div>
                        ) : null;
                    })}
                </div>
            );
        });
    };

    const renderToolResults = () => {
        // Look for tool result messages that follow this message
        if (message.role !== 'tool') {
            return null;
        }

        const result = formatToolResult(message.content);

        return (
            <div className="chat-message__tool-result">
                <div className="chat-message__tool-result-summary">
                    {renderFormattedText(result.formatted)}
                </div>
                {result.type !== 'text' && (
                    <details className="chat-message__tool-result-details">
                        <summary>Raw Data</summary>
                        <pre>{JSON.stringify(result.data, null, 2)}</pre>
                    </details>
                )}
            </div>
        );
    };

    const renderUsageInfo = () => {
        if (!message.metadata?.usage) {
            return null;
        }

        const {usage} = message.metadata;
        return (
            <div className="chat-message__usage">
                <span>
                    Tokens: {usage.totalTokens} ({usage.promptTokens} + {usage.completionTokens})
                </span>
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
                <div className="chat-message__avatar">{getMessageIcon()}</div>
                <div className="chat-message__meta">
                    <span className="chat-message__role">
                        {message.role === 'user'
                            ? 'You'
                            : message.role === 'tool'
                              ? 'Tool Result'
                              : 'Assistant'}
                    </span>
                    <span className="chat-message__timestamp">
                        {formatTimestamp(message.timestamp)}
                    </span>
                </div>
                <div className="chat-message__actions">
                    <Button view="flat" size="xs" onClick={handleCopyContent} title="Copy message">
                        <Icon data={CopyIcon} />
                    </Button>
                </div>
            </div>

            <div className="chat-message__content">
                {message.role === 'tool'
                    ? renderToolResults()
                    : message.content && (
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

                {/* Show usage breakdown for assistant messages */}
                {message.role === 'assistant' && message.usageBreakdown && (
                    <UsageDisplay usage={message.usageBreakdown} />
                )}
            </div>
        </div>
    );
};
