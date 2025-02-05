import type {
    AcceptEvent,
    DeclineEvent,
    IgnoreEvent,
    PromptFile,
    Suggestions,
} from '@ydb-platform/monaco-ghost';

import type {TelemetryOpenTabs} from '../../../types/api/codeAssist';
import {api} from '../api';

export const codeAssistApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getCodeAssistSuggestions: builder.query<Suggestions, PromptFile[]>({
            queryFn: async (promptFiles: PromptFile[]) => {
                try {
                    if (window.api.codeAssist) {
                        const data =
                            await window.api.codeAssist.getCodeAssistSuggestions(promptFiles);
                        return {data};
                    } else {
                        throw new Error('Method is not implemented.');
                    }
                } catch {
                    return {data: {items: []}};
                }
            },
        }),

        acceptSuggestion: builder.mutation({
            queryFn: async (event: AcceptEvent) => {
                try {
                    if (window.api.codeAssist) {
                        const data = await window.api.codeAssist.sendCodeAssistTelemetry({
                            Accepted: {
                                AcceptedText: event.acceptedText,
                                ConvertedText: event.acceptedText,
                                Timestamp: Date.now(),
                                RequestId: event.requestId,
                            },
                        });
                        return {data};
                    } else {
                        throw new Error('Method is not implemented.');
                    }
                } catch (error) {
                    return {error};
                }
            },
        }),

        discardSuggestion: builder.mutation({
            queryFn: async (event: DeclineEvent) => {
                try {
                    if (window.api.codeAssist) {
                        const data = await window.api.codeAssist.sendCodeAssistTelemetry({
                            Discarded: {
                                RequestId: event.requestId,
                                Timestamp: Date.now(),
                                DiscardReason: 'OnCancel',
                                DiscardedText: event.suggestionText,
                                CacheHitCount: event.hitCount,
                            },
                        });
                        return {data};
                    } else {
                        throw new Error('Method is not implemented.');
                    }
                } catch (error) {
                    return {error};
                }
            },
        }),

        ignoreSuggestion: builder.mutation({
            queryFn: async (event: IgnoreEvent) => {
                try {
                    if (window.api.codeAssist) {
                        const data = await window.api.codeAssist.sendCodeAssistTelemetry({
                            Ignored: {
                                RequestId: event.requestId,
                                Timestamp: Date.now(),
                                IgnoredText: event.suggestionText,
                            },
                        });
                        return {data};
                    } else {
                        throw new Error('Method is not implemented.');
                    }
                } catch (error) {
                    return {error};
                }
            },
        }),

        sendUserQueriesData: builder.mutation({
            queryFn: async (userQueries: TelemetryOpenTabs) => {
                try {
                    if (window.api.codeAssist) {
                        const data =
                            await window.api.codeAssist.sendCodeAssistOpenTabs(userQueries);
                        return {data};
                    } else {
                        throw new Error('Method is not implemented.');
                    }
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
