// Components
export {ChatPanel} from './components/ChatPanel/ChatPanel';
export {ChatMessage} from './components/ChatMessage/ChatMessage';
export {ChatInput} from './components/ChatInput/ChatInput';
export {AIAssistantButton} from './components/AIAssistantButton/AIAssistantButton';
export {ToolCallBlock} from './components/ToolCallBlock/ToolCallBlock';

// Hooks
export {useChat} from './hooks/useChat';

// Store
export {chatActions, chatReducer} from './store/chatSlice';

// Types
export type {
    ChatMessage as ChatMessageType,
    ChatDelta,
    ChatState,
    ToolCall,
    ChatRequest,
} from './types/chat';

// Note: contextService is not exported here to avoid circular dependencies
// Import it directly from './services/contextService' when needed
