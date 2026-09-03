import type {QueryPlan} from '../../../../types/api/query';

/**
 * Parse the Plan column value from .sys/streaming_queries.
 * Returns undefined when the value is absent, empty, malformed JSON, or lacks `meta`
 * (a QueryPlan without `meta` is not processable by preparePlanData).
 */
export function parseStreamingQueryPlan(planText?: string): QueryPlan | undefined {
    if (typeof planText !== 'string' || !planText) {
        return undefined;
    }
    try {
        const parsed: unknown = JSON.parse(planText);
        if (!parsed || typeof parsed !== 'object' || !('meta' in parsed)) {
            return undefined;
        }
        return parsed as QueryPlan;
    } catch {
        return undefined;
    }
}
