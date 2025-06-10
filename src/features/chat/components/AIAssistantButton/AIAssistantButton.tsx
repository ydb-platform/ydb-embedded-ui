import React from 'react';
import {Button, Icon} from '@gravity-ui/uikit';
import {FaceRobot} from '@gravity-ui/icons';
import {useSelector} from 'react-redux';
import {useChat} from '../../hooks/useChat';
import {ChatState} from '../../types/chat';
import './AIAssistantButton.scss';

interface AIAssistantButtonProps {
    className?: string;
}

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({className}) => {
    const {isOpen, isStreaming, messages} = useSelector((state: {chat: ChatState}) => state.chat);
    const {toggleChat} = useChat();

    const hasUnreadMessages = messages.length > 0 && !isOpen;

    return (
        <Button
            view="flat"
            onClick={toggleChat}
            className={`ai-assistant-button ${className || ''} ${hasUnreadMessages ? 'ai-assistant-button--has-messages' : ''}`}
            title={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        >
            AI Assistant
            <Icon data={FaceRobot} />
            {isStreaming && (
                <span className="ai-assistant-button__indicator ai-assistant-button__indicator--streaming" />
            )}
            {hasUnreadMessages && (
                <span className="ai-assistant-button__indicator ai-assistant-button__indicator--unread" />
            )}
        </Button>
    );
};
