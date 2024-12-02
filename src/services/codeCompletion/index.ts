// Export types needed for API and store integration
export type {
    ICodeCompletionAPI,
    ICodeCompletionService,
    CodeCompletionConfig,
    PromptFile,
    Suggestions,
    TelemetryEvent,
    TelemetryOpenTabs,
} from './types';

// Export functions needed for Monaco editor integration
export {createCompletionProvider} from './factory';
export {registerCompletionCommands} from './registerCommands';
