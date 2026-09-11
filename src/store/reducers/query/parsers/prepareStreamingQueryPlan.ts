import type {PreparedQueryData} from '../types';

import {parseStreamingQueryPlan} from './parseStreamingQueryPlan';
import {preparePlanData} from './preparePlanData';

interface StreamingQueryPlan {
    hasPlan: boolean;
    prepared?: PreparedQueryData['preparedPlan'];
}

function isPlanNode(value: unknown) {
    return Boolean(value && typeof value === 'object' && 'Node Type' in value);
}

export function prepareStreamingQueryPlan(planText?: string): StreamingQueryPlan {
    const plan = parseStreamingQueryPlan(planText);
    if (!plan) {
        return {hasPlan: false};
    }
    if (plan.Plan && !isPlanNode(plan.Plan)) {
        return {hasPlan: true};
    }
    try {
        const {simplifiedPlan: _simplifiedPlan, ...prepared} = preparePlanData(plan);
        return {hasPlan: true, prepared};
    } catch {
        return {hasPlan: true};
    }
}
