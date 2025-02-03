import type {PromptFile, Suggestions} from '@ydb-platform/monaco-ghost';

import {api} from '../api';

export const codeAssistApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getCodeAssistSuggestions: builder.query<Suggestions, PromptFile[]>({
            queryFn: async (prompt: PromptFile[]) => {
                try {
                    if (window.api.codeAssist) {
                        const data = await window.api.codeAssist.getCodeAssistSuggestions(prompt);
                        return {data};
                    } else {
                        throw new Error('Method is not implemented.');
                    }
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
