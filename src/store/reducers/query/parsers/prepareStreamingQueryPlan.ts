import type {PreparedQueryData} from '../types';

import {parseStreamingQueryPlan} from './parseStreamingQueryPlan';
import {preparePlanData} from './preparePlanData';

interface StreamingQueryPlan {
    hasPlan: boolean;
    prepared?: PreparedQueryData['preparedPlan'];
}

export function prepareStreamingQueryPlan(planText?: string): StreamingQueryPlan {
    const plan = parseStreamingQueryPlan(planText);
    if (!plan) {
        return {hasPlan: false};
    }
    try {
        const {simplifiedPlan: _simplifiedPlan, ...prepared} = preparePlanData(plan);
        return {hasPlan: true, prepared};
    } catch {
        return {hasPlan: true};
    }
}
