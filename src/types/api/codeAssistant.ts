type IdeInfo = {
    Ide: string;
    IdeVersion: string;
    PluginFamily: string;
    PluginVersion: string;
};

export interface Prompt {
    Files: PromptFile[];
    ContextCreateType: ContextCreateType;
    ForceSuggest?: boolean;
    IdeInfo: IdeInfo;
}

export interface PromptPosition {
    Ln: number;
    Col: number;
}

export interface PromptFragment {
    Text: string;
    Start: PromptPosition;
    End: PromptPosition;
}

export interface PromptFile {
    Path: string;
    Fragments: PromptFragment[];
    Cursor: PromptPosition;
}

export type ContextCreateType = 1;

export interface Suggestions {
    Suggests: Suggestion[];
    RequestId: string;
}

export type DiscardReason = 'OnCancel';

export interface Suggestion {
    Text: string;
}

export interface AcceptSuggestionEvent {
    Accepted: {
        RequestId: string;
        Timestamp: number;
        AcceptedText: string;
        ConvertedText: string;
    };
}
export interface DiscardSuggestionEvent {
    Discarded: {
        RequestId: string;
        Timestamp: number;
        DiscardReason: 'OnCancel';
        DiscardedText: string;
        CacheHitCount: number;
    };
}
export interface IgnoreSuggestionEvent {
    Ignored: {
        RequestId: string;
        Timestamp: number;
        IgnoredText: string;
    };
}

export type TelemetryEvent = AcceptSuggestionEvent | DiscardSuggestionEvent | IgnoreSuggestionEvent;

type OpenTab = {
    FileName: string;
    Text: string;
};

export type TelemetryOpenTabs = OpenTab[];
