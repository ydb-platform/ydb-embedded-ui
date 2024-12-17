import {codeAssistantBackend as CODE_ASSISTANT_BACKEND} from '../../store';
import type {PromptFile, Suggestions, TelemetryEvent, TelemetryOpenTabs} from '../codeCompletion';

import {BaseYdbAPI} from './base';

const ideInfo = {
    Ide: 'ydb',
    IdeVersion: '1',
    PluginFamily: 'ydb',
    PluginVersion: '0.2',
};

export class CodeAssistAPI extends BaseYdbAPI {
    getPath(path: string) {
        return `${CODE_ASSISTANT_BACKEND ?? ''}${path}`;
    }

    getCodeAssistSuggestions(data: PromptFile[]): Promise<Suggestions> {
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

    sendCodeAssistTelemetry(data: TelemetryEvent): Promise<unknown> {
        return this.post(this.getPath('/code-assist-telemetry'), data, null, {
            concurrentId: 'code-assist-telemetry',
            collectRequest: false,
        });
    }

    sendCodeAssistOpenTabs(data: TelemetryOpenTabs): Promise<unknown> {
        return this.post(
            this.getPath('/code-assist-telemetry'),
            {OpenTabs: {Tabs: data, IdeInfo: ideInfo}},
            null,
            {
                concurrentId: 'code-assist-telemetry',
                collectRequest: false,
            },
        );
    }
}
