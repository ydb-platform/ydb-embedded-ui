import type {PromptFile, Suggestions} from '@ydb-platform/monaco-ghost';

import {codeAssistBackend as CODE_ASSISTANT_BACKEND} from '../../store';

import {BaseYdbAPI} from './base';
const ideInfo = {
    Ide: 'ydb',
    IdeVersion: '1',
    PluginFamily: 'ydb',
    PluginVersion: '0.2',
};

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

export type TelemetryOpenTabs = OpenTab[];

export type TelemetryEvent = AcceptSuggestionEvent | DiscardSuggestionEvent | IgnoreSuggestionEvent;
export class CodeAssistAPI extends BaseYdbAPI {
    getPath(path: string) {
        return `${CODE_ASSISTANT_BACKEND ?? ''}${path}`;
    }

    getCodeAssistSuggestions(data: PromptFile[]) {
        return this.post<Suggestions>(
            this.getPath('/code-assist-suggestion'),
            {
                Files: data,
                ContextCreateType: 1,
                IdeInfo: ideInfo,
            },
            null,
            {
                concurrentId: 'code-assist-suggestion',
                collectRequest: false,
            },
        );
    }

    sendCodeAssistTelemetry(data: TelemetryEvent) {
        return this.post('/code-assist-telemetry', data, null, {
            concurrentId: 'code-assist-telemetry',
            collectRequest: true,
        });
    }

    sendCodeAssistOpenTabs(data: TelemetryOpenTabs) {
        return this.post(
            '/code-assist-telemetry',
            {OpenTabs: {Tabs: data, IdeInfo: ideInfo}},
            null,
            {
                concurrentId: 'code-assist-telemetry',
                collectRequest: false,
            },
        );
    }
}
