import React from 'react';

import {CirclePlay, CircleStop} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon, TextArea} from '@gravity-ui/uikit';

import './ChatInput.scss';

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

    const handleSubmit = () => {
        if (message.trim() && !disabled) {
            onSendMessage(message.trim());
            setMessage('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleChange = (value: string) => {
        setMessage(value);
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

    const actionButton = isStreaming ? (
        <ActionTooltip title="Stop generation">
            <Button
                view="flat-danger"
                size="m"
                onClick={handleStop}
                className="chat-input__stop-button"
            >
                <Icon data={CircleStop} size={16} />
                Stop
            </Button>
        </ActionTooltip>
    ) : (
        <ActionTooltip title="Send message (Enter)">
            <Button
                view="action"
                size="m"
                disabled={disabled || !message.trim()}
                onClick={handleSubmit}
                className="chat-input__send-button"
            >
                <Icon data={CirclePlay} size={16} />
                Send
            </Button>
        </ActionTooltip>
    );

    return (
        <div className="chat-input">
            <div className="chat-input__container">
                <TextArea
                    controlRef={textAreaRef}
                    value={message}
                    onUpdate={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoFocus
                    size="xl"
                    minRows={1}
                    maxRows={6}
                    className="chat-input__field"
                />
                <div className="chat-input__button-container">{actionButton}</div>
            </div>
        </div>
    );
};
