import type {QueryPlan} from '../../../../types/api/query';

export function parseStreamingQueryPlan(planText?: string): QueryPlan | undefined {
    if (typeof planText !== 'string' || !planText) {
        return undefined;
    }
    try {
        const parsed: unknown = JSON.parse(planText);
        if (!parsed || typeof parsed !== 'object') {
            return undefined;
        }
        const meta = (parsed as Record<string, unknown>).meta;
        if (typeof meta !== 'object' || meta === null) {
            return undefined;
        }
        return parsed as QueryPlan;
    } catch {
        return undefined;
    }
}
