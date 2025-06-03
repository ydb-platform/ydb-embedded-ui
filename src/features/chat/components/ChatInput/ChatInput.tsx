import React from 'react';

import {Button, Icon, TextArea} from '@gravity-ui/uikit';

import './ChatInput.scss';

// Icons - these would need to be imported from your icon library
const SendIcon = () => <span>➤</span>;
const StopIcon = () => <span>⏹</span>;

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    disabled?: boolean;
    isStreaming?: boolean;
    onStopGeneration?: () => void;
    placeholder?: string;
}

export const ChatInput = ({
    onSendMessage,
    disabled = false,
    isStreaming = false,
    onStopGeneration,
    placeholder = 'Ask about your YDB cluster, databases, or queries...',
}: ChatInputProps) => {
    const [message, setMessage] = React.useState('');
    const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSendMessage(message.trim());
            setMessage('');
            // Reset textarea height
            if (textAreaRef.current) {
                textAreaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleChange = (value: string) => {
        setMessage(value);
        // Auto-resize textarea
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    };

    const handleStop = () => {
        if (onStopGeneration) {
            onStopGeneration();
        }
    };

    // Focus on mount
    React.useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.focus();
        }
    }, []);

    return (
        <form className="chat-input" onSubmit={handleSubmit}>
            <div className="chat-input__field">
                <TextArea
                    ref={textAreaRef}
                    value={message}
                    onUpdate={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                    autoFocus
                    minRows={1}
                    maxRows={8}
                    className="chat-input__textarea"
                />
            </div>

            <div className="chat-input__actions">
                {isStreaming ? (
                    <Button
                        view="action"
                        size="m"
                        onClick={handleStop}
                        title="Stop generation"
                        className="chat-input__stop-button"
                    >
                        <Icon data={StopIcon} />
                        Stop
                    </Button>
                ) : (
                    <Button
                        view="action"
                        size="m"
                        type="submit"
                        disabled={disabled || !message.trim()}
                        title="Send message (Enter)"
                        className="chat-input__send-button"
                    >
                        <Icon data={SendIcon} />
                        Send
                    </Button>
                )}
            </div>
        </form>
    );
};
