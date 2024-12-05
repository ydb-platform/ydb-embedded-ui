import {CodeCompletionService} from './CodeCompletionService';
import {TelemetryService} from './TelemetryService';
import type {CodeCompletionConfig, ICodeCompletionAPI} from './types';

const DEFAULT_CONFIG: Required<CodeCompletionConfig> = {
    debounceTime: 200,
    textLimits: {
        beforeCursor: 8000,
        afterCursor: 1000,
    },
    telemetry: {
        enabled: true,
    },
    suggestionCache: {
        enabled: true,
    },
};

function mergeWithDefaults(userConfig?: CodeCompletionConfig): Required<CodeCompletionConfig> {
    if (!userConfig) {
        return DEFAULT_CONFIG;
    }

    return {
        debounceTime: userConfig.debounceTime ?? DEFAULT_CONFIG.debounceTime,
        textLimits: {
            beforeCursor:
                userConfig.textLimits?.beforeCursor ?? DEFAULT_CONFIG.textLimits.beforeCursor,
            afterCursor:
                userConfig.textLimits?.afterCursor ?? DEFAULT_CONFIG.textLimits.afterCursor,
        },
        telemetry: {
            enabled: userConfig.telemetry?.enabled ?? DEFAULT_CONFIG.telemetry.enabled,
        },
        suggestionCache: {
            enabled: userConfig.suggestionCache?.enabled ?? DEFAULT_CONFIG.suggestionCache.enabled,
        },
    };
}

export function createCompletionProvider(api: ICodeCompletionAPI, config?: CodeCompletionConfig) {
    const mergedConfig = mergeWithDefaults(config);

    const telemetryService = new TelemetryService(
        mergedConfig.telemetry.enabled
            ? (data) => api.sendCodeAssistTelemetry(data)
            : () => Promise.resolve(undefined),
        mergedConfig,
    );

    return new CodeCompletionService(api, telemetryService, mergedConfig);
}

export {DEFAULT_CONFIG};
