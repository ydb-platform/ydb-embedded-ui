import AxiosWrapper from '@gravity-ui/axios-wrapper';
import type {AxiosRequestConfig} from 'axios';

import {backend as BACKEND} from '../store';
import type {
    PromptFile,
    Suggestions,
    TelemetryEvent,
    TelemetryOpenTabs,
} from '../types/api/codeAssist';

const ideInfo = {
    Ide: 'yql',
    IdeVersion: '1',
    PluginFamily: 'yql',
    PluginVersion: '0.2',
};

export class CodeAssistAPI extends AxiosWrapper {
    getPath(path: string) {
        return `${BACKEND ?? ''}${path}`;
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
        return this.post(this.getPath('/code-assist-telemetry'), data, null, {
            concurrentId: 'code-assist-telemetry',
            collectRequest: false,
        });
    }

    sendCodeAssistOpenTabs(data: TelemetryOpenTabs) {
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

export function createCodeAssistApi({withCredentials = false} = {}) {
    const config: AxiosRequestConfig = {withCredentials};
    return new CodeAssistAPI({config});
}
