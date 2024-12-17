import type {CodeCompletionConfig, DiscardReason, ITelemetryService, TelemetryEvent} from './types';

export class TelemetryService implements ITelemetryService {
    private readonly sendTelemetry: (data: TelemetryEvent) => Promise<unknown>;
    private readonly config: Required<NonNullable<CodeCompletionConfig['telemetry']>>;

    constructor(
        sendTelemetry: (data: TelemetryEvent) => Promise<unknown>,
        config: CodeCompletionConfig = {},
    ) {
        this.sendTelemetry = sendTelemetry;
        this.config = {
            enabled: config.telemetry?.enabled ?? true,
        };
    }

    sendAcceptTelemetry(requestId: string, acceptedText: string): void {
        const data: TelemetryEvent = {
            Accepted: {
                RequestId: requestId,
                Timestamp: Date.now(),
                AcceptedText: acceptedText,
                ConvertedText: acceptedText,
            },
        };
        this.send(data);
    }

    sendDeclineTelemetry(
        requestId: string,
        suggestionText: string,
        reason: DiscardReason,
        hitCount: number,
    ): void {
        const data: TelemetryEvent = {
            Discarded: {
                RequestId: requestId,
                Timestamp: Date.now(),
                DiscardReason: reason,
                DiscardedText: suggestionText,
                CacheHitCount: hitCount,
            },
        };
        this.send(data);
    }

    sendIgnoreTelemetry(requestId: string, suggestionText: string): void {
        const data: TelemetryEvent = {
            Ignored: {
                RequestId: requestId,
                Timestamp: Date.now(),
                IgnoredText: suggestionText,
            },
        };
        this.send(data);
    }

    private send(data: TelemetryEvent): void {
        if (!this.config.enabled) {
            return;
        }

        try {
            this.sendTelemetry(data);
        } catch (e) {
            console.error('Failed to send telemetry:', e);
        }
    }
}
