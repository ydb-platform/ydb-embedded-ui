import {Star} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';
import {useSelector} from 'react-redux';

import {useChat} from '../../hooks/useChat';
import type {ChatState} from '../../types/chat';

import './AIAssistantButton.scss';

interface AIAssistantButtonProps {
    className?: string;
}

export const AIAssistantButton = ({className}: AIAssistantButtonProps) => {
    const {isOpen, isStreaming, messages} = useSelector((state: {chat: ChatState}) => state.chat);
    const {toggleChat} = useChat();

    const hasUnreadMessages = messages.length > 0 && !isOpen;

    return (
        <Button
            view="flat-utility"
            onClick={toggleChat}
            className={`ai-assistant-button ${className || ''} ${hasUnreadMessages ? 'ai-assistant-button--has-messages' : ''}`}
            title={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        >
            <Icon data={Star} />
            AI Assistant
            {isStreaming && (
                <span className="ai-assistant-button__indicator ai-assistant-button__indicator--streaming" />
            )}
            {hasUnreadMessages && (
                <span className="ai-assistant-button__indicator ai-assistant-button__indicator--unread" />
            )}
        </Button>
    );
};
