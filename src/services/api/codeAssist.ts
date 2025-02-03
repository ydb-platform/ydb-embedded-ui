import type {PromptFile, Suggestions} from '@ydb-platform/monaco-ghost';

import {codeAssistBackend as CODE_ASSISTANT_BACKEND} from '../../store';

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
}
