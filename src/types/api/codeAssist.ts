export interface PromptFile {
    Path: string;
    Content: string;
}

export interface Suggestions {
    Suggestions: string[];
}

export interface TelemetryEvent {
    EventType: string;
    EventData: Record<string, unknown>;
}

export interface TelemetryOpenTabs {
    Path: string;
    Content: string;
}
