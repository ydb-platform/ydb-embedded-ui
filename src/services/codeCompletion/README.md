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
   - Configurable telemetry collection

3. **PromptContent** (`promptContent.ts`)

   - Handles extraction of code context for suggestions
   - Manages text fragments before and after cursor
   - Implements text length limits and cursor positioning
   - Creates structured prompt data for API requests

4. **Factory** (`factory.ts`)

   - Creates and configures the completion provider
   - Wires together the completion and telemetry services
   - Manages configuration defaults and merging

5. **Command Registration** (`registerCommands.ts`)
   - Registers Monaco editor commands for completion actions
   - Handles accept/decline completion commands

### Integration Points

1. **Monaco Editor Integration**

   - Registers the completion provider with Monaco
   - Manages provider lifecycle
   - Integrates with YQL language support

2. **Query Editor Integration**
   - Initializes code completion when editor mounts
   - Registers completion commands
   - Handles user interactions

## Data Flow

1. **Prompt Generation**

   ```
   Editor Change -> PromptContent.getPromptFileContent
   -> Text Fragments with Cursor Position -> API Request
   ```

2. **Suggestion Generation**

   ```
   Prompt Data -> CodeCompletionService.provideInlineCompletions
   -> API Request -> Suggestions Returned -> Monaco Display
   ```

3. **Suggestion Acceptance**

   ```
   User Accept -> handleAccept -> TelemetryService.sendAcceptTelemetry
   -> API Telemetry Event
   ```

4. **Suggestion Rejection**
   ```
   User Decline -> commandDiscard -> TelemetryService.sendDeclineTelemetry
   -> API Telemetry Event
   ```

## Configuration Options

The service accepts a configuration object with these options:

```typescript
interface CodeCompletionConfig {
  // Performance settings
  debounceTime?: number; // Time in ms to debounce API calls (default: 200)

  // Text limits
  textLimits?: {
    beforeCursor?: number; // Characters to include before cursor (default: 8000)
    afterCursor?: number; // Characters to include after cursor (default: 1000)
  };

  // Telemetry settings
  telemetry?: {
    enabled?: boolean; // Whether to enable telemetry (default: true)
  };

  // Cache settings
  suggestionCache?: {
    enabled?: boolean; // Whether to enable suggestion caching (default: true)
  };
}
```

## Key Features

1. **Prompt Generation**

   - Extracts relevant code context around cursor
   - Implements smart text truncation (8000 chars before, 1000 after cursor)
   - Maintains cursor position information
   - Creates structured prompt format for API

2. **Suggestion Caching**

   - Caches suggestions to reduce API calls
   - Tracks suggestion display count
   - Manages suggestion lifecycle
   - Configurable caching behavior

3. **Telemetry**

   - Tracks suggestion acceptance rate
   - Records user interaction patterns
   - Monitors suggestion quality
   - Configurable telemetry collection

4. **Command Integration**
   - Keyboard shortcuts for completion actions
   - Context menu integration
   - Custom commands for completion workflow

## API Interface

The completion service requires an API implementation with these methods:

```typescript
interface ICodeCompletionAPI {
  getCodeAssistSuggestions(data: PromptFile[]): Promise<Suggestions>;
  sendCodeAssistTelemetry(data: TelemetryEvent): Promise<unknown>;
}

interface Suggestions {
  Suggests: Suggestion[];
  RequestId: string;
}

interface Suggestion {
  Text: string;
}
```

## Prompt Format

The prompt generation creates structured data in this format:

```typescript
interface PromptFile {
  Path: string;
  Fragments: PromptFragment[];
  Cursor: PromptPosition;
}

interface PromptFragment {
  Text: string;
  Start: PromptPosition;
  End: PromptPosition;
}

interface PromptPosition {
  Ln: number;
  Col: number;
}
```

## Telemetry Events

The system tracks three types of events:

1. **Acceptance Events**

   ```typescript
   interface AcceptSuggestionEvent {
     Accepted: {
       RequestId: string;
       Timestamp: number;
       AcceptedText: string;
       ConvertedText: string;
     };
   }
   ```

2. **Discard Events**

   ```typescript
   interface DiscardSuggestionEvent {
     Discarded: {
       RequestId: string;
       Timestamp: number;
       DiscardReason: 'OnCancel';
       DiscardedText: string;
       CacheHitCount: number;
     };
   }
   ```

3. **Ignore Events**
   ```typescript
   interface IgnoreSuggestionEvent {
     Ignored: {
       RequestId: string;
       Timestamp: number;
       IgnoredText: string;
     };
   }
   ```

## Usage Example

```typescript
import {createCompletionProvider, registerCompletionCommands} from './codeCompletion';

// Create API implementation
const api: ICodeCompletionAPI = {
    getCodeAssistSuggestions: async (data) => { ... },
    sendCodeAssistTelemetry: async (data) => { ... }
};

// Configure the service
const config: CodeCompletionConfig = {
    debounceTime: 200,
    textLimits: {
        beforeCursor: 8000,
        afterCursor: 1000
    },
    telemetry: {
        enabled: true
    },
    suggestionCache: {
        enabled: true
    }
};

// Create provider
const completionProvider = createCompletionProvider(api, config);

// Register with Monaco
monaco.languages.registerInlineCompletionsProvider('yql', completionProvider);

// Register commands
registerCompletionCommands(monaco, completionProvider, editor);
```

## Best Practices

1. **Prompt Generation**

   - Consider text limits for optimal performance
   - Maintain cursor position accuracy
   - Handle edge cases in text extraction

2. **Error Handling**

   - All API calls should be wrapped in try-catch blocks
   - Failed suggestions should not break the editor
   - Telemetry failures should be logged but not impact user experience

3. **Performance**

   - Suggestions are throttled to prevent excessive API calls
   - Caching reduces server load
   - Completion provider is disposed when not needed

4. **User Experience**
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
6. Follow text limit guidelines in prompt generation

## Related Components

- Monaco Editor Configuration
- YQL Language Support
- Query Editor Implementation
- Code Assistant API Integration
