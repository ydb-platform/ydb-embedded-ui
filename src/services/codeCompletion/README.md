# Code Completion Service

This module provides inline code completion functionality for the YDB Query Editor using Monaco Editor. It implements a sophisticated completion system with telemetry tracking and command integration.

## Architecture Overview

The code completion system consists of several key components working together:

### Core Components

1. **CodeCompletionService** (`CodeCompletionService.ts`)

   - Implements Monaco's `InlineCompletionsProvider` interface
   - Manages completion suggestions and their lifecycle
   - Handles caching of suggestions
   - Processes user interactions with suggestions (accept/decline/ignore)

2. **TelemetryService** (`TelemetryService.ts`)

   - Tracks completion usage metrics
   - Records acceptance, decline, and ignore events
   - Captures timing and interaction data

3. **PromptContent** (`promptContent.ts`)

   - Handles extraction of code context for suggestions
   - Manages text fragments before and after cursor
   - Implements text length limits and cursor positioning
   - Creates structured prompt data for API requests

4. **Factory** (`factory.ts`)

   - Creates and configures the completion provider
   - Wires together the completion and telemetry services

5. **Command Registration** (`registerCommands.ts`)

   - Registers Monaco editor commands for completion actions
   - Handles accept/decline completion commands

6. **CodeAssistantTelemetry** (`CodeAssistantTelemetry.tsx`)
   - Optional context caching mechanism
   - Tracks query history as virtual "open tabs"
   - Sends historical queries to the backend for context-aware suggestions
   - Each query is treated as a virtual file with `.yql` extension
   - Helps improve suggestion relevance by providing historical context

### Integration Points

1. **Monaco Editor Integration** (`ydb.inlineCompletionProvider.ts`)

   - Registers the completion provider with Monaco
   - Manages provider lifecycle
   - Integrates with YQL language support

2. **Query Editor Integration** (`QueryEditor.tsx`)
   - Initializes code completion when editor mounts
   - Registers completion commands
   - Handles user interactions

## Data Flow

1. **Context Building**

   ```
   Query History Changes -> CodeAssistantTelemetry
   -> sendOpenTabs -> Backend Context Cache
   ```

2. **Prompt Generation**

   ```
   Editor Change -> PromptContent.getPromptFileContent
   -> Text Fragments with Cursor Position -> API Request
   ```

3. **Suggestion Generation**

   ```
   Prompt Data -> CodeCompletionService.provideInlineCompletions
   -> API Request (with cached context) -> Suggestions Returned -> Monaco Display
   ```

4. **Suggestion Acceptance**

   ```
   User Accept -> handleAccept -> TelemetryService.sendAcceptTelemetry
   -> API Telemetry Event
   ```

5. **Suggestion Rejection**
   ```
   User Decline -> commandDiscard -> TelemetryService.sendDeclineTelemetry
   -> API Telemetry Event
   ```

## Key Features

1. **Prompt Generation**

   - Extracts relevant code context around cursor
   - Implements smart text truncation (8000 chars before, 1000 after cursor)
   - Maintains cursor position information
   - Creates structured prompt format for API

2. **Context Caching**

   - Maintains history of queries as virtual open tabs
   - Each query is assigned a unique ID and treated as a `.yql` file
   - Provides historical context to improve suggestion relevance
   - Optional feature that can be enabled/disabled

3. **Suggestion Caching**

   - Caches suggestions to reduce API calls
   - Tracks suggestion display count
   - Manages suggestion lifecycle

4. **Telemetry**

   - Tracks suggestion acceptance rate
   - Records user interaction patterns
   - Monitors suggestion quality

5. **Command Integration**
   - Keyboard shortcuts for completion actions
   - Context menu integration
   - Custom commands for completion workflow

## API Interface

The completion service expects an API implementation with these methods:

```typescript
interface ICodeCompletionAPI {
  getCodeAssistSuggestions(data: PromptFile[]): Promise<Suggestions>;
  sendCodeAssistTelemetry(data: TelemetryEvent): Promise<unknown>;
}
```

## Prompt Format

The prompt generation creates structured data in this format:

```typescript
interface PromptFile {
  Fragments: {
    Text: string;
    Start: {Ln: number; Col: number};
    End: {Ln: number; Col: number};
  }[];
  Cursor: {Ln: number; Col: number};
  Path: string;
}
```

## Context Caching Format

When using the context caching feature, queries are sent in this format:

```typescript
interface Tab {
  FileName: string; // Format: "query_{queryId}.yql"
  Text: string; // The actual query text
}
```

## Telemetry Events

The system tracks three types of events:

1. **Acceptance Events**

   - When user accepts a suggestion
   - Includes accepted text and timestamp

2. **Discard Events**

   - When user explicitly declines a suggestion
   - Includes reason and cache hit count

3. **Ignore Events**
   - When suggestions are shown but not interacted with
   - Tracks ignored suggestions for quality metrics

## Usage Example

```typescript
// Initialize the completion provider
const api: ICodeCompletionAPI = {
    getCodeAssistSuggestions: async (data) => { ... },
    sendCodeAssistTelemetry: async (data) => { ... }
};

// Register with Monaco
registerInlineCompletionProvider(api);

// Register commands
registerCompletionCommands(editor, monaco, completionService);
```

## Best Practices

1. **Prompt Generation**

   - Consider text limits for optimal performance
   - Maintain cursor position accuracy
   - Handle edge cases in text extraction

2. **Context Management**

   - Consider enabling context caching for better suggestions
   - Monitor the size of historical context
   - Clean up old context when no longer relevant

3. **Error Handling**

   - All API calls should be wrapped in try-catch blocks
   - Failed suggestions should not break the editor
   - Telemetry failures should be logged but not impact user experience

4. **Performance**

   - Suggestions are throttled to prevent excessive API calls
   - Caching reduces server load
   - Completion provider is disposed when not needed

5. **User Experience**
   - Suggestions appear inline with minimal delay
   - Clear feedback for acceptance/rejection
   - Non-intrusive telemetry collection

## Contributing

When modifying the code completion system:

1. Ensure all telemetry events are properly tracked
2. Maintain backward compatibility with existing API
3. Update tests for new functionality
4. Consider performance implications of changes
5. Document new features or changes
6. Consider impact on context caching when modifying query handling
7. Follow text limit guidelines in prompt generation

## Related Components

- Monaco Editor Configuration
- YQL Language Support
- Query Editor Implementation
- Code Assistant API Integration
- Query History Management
