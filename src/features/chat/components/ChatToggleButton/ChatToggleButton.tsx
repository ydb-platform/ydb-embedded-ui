import React from 'react';
import { Button, Icon } from '@gravity-ui/uikit';
import { useSelector } from 'react-redux';
import { useChat } from '../../hooks/useChat';
import { ChatState } from '../../types/chat';
import './ChatToggleButton.scss';

// Icons - these would need to be imported from your icon library
const ChatIcon = () => <span>💬</span>;
const CloseIcon = () => <span>✕</span>;

interface ChatToggleButtonProps {
    className?: string;
    size?: 's' | 'm' | 'l' | 'xl';
    view?: 'normal' | 'action' | 'outlined' | 'flat' | 'raised';
}

export const ChatToggleButton: React.FC<ChatToggleButtonProps> = ({
    className,
    size = 'm',
    view = 'action'
}) => {
    const { isOpen, isStreaming, messages } = useSelector(
        (state: { chat: ChatState }) => state.chat
    );
    const { toggleChat } = useChat();

    const hasUnreadMessages = messages.length > 0 && !isOpen;

    return (
        <Button
            view={view}
            size={size}
            onClick={toggleChat}
            className={`chat-toggle-button ${className || ''} ${hasUnreadMessages ? 'chat-toggle-button--has-messages' : ''}`}
            title={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        >
            <Icon data={isOpen ? CloseIcon : ChatIcon} />
            {isStreaming && (
                <span className="chat-toggle-button__indicator chat-toggle-button__indicator--streaming" />
            )}
            {hasUnreadMessages && (
                <span className="chat-toggle-button__indicator chat-toggle-button__indicator--unread" />
            )}
            AI Assistant
        </Button>
    );
};