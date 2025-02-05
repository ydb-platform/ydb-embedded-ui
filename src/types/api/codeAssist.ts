interface AcceptSuggestionEvent {
    Accepted: {
        RequestId: string;
        Timestamp: number;
        AcceptedText: string;
        ConvertedText: string;
    };
}
interface DiscardSuggestionEvent {
    Discarded: {
        RequestId: string;
        Timestamp: number;
        DiscardReason: 'OnCancel';
        DiscardedText: string;
        CacheHitCount: number;
    };
}
interface IgnoreSuggestionEvent {
    Ignored: {
        RequestId: string;
        Timestamp: number;
        IgnoredText: string;
    };
}

type OpenTab = {
    FileName: string;
    Text: string;
};

interface Position {
    Ln: number;
    Col: number;
}

interface Fragment {
    Text: string;
    Start: Position;
    End: Position;
}

interface File {
    Fragments: Fragment[];
    Cursor: Position;
    Path: string;
}

export type CodeAssistSuggestionsFiles = File[];

export type CodeAssistSuggestionsResponse = {
    RequestId: string;
    Suggests: {Text: string}[];
};

export type TelemetryOpenTabs = OpenTab[];

export type TelemetryEvent = AcceptSuggestionEvent | DiscardSuggestionEvent | IgnoreSuggestionEvent;
