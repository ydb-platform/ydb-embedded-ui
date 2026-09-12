import type {PreparedQueryData} from '../types';

import {parseStreamingQueryPlan} from './parseStreamingQueryPlan';
import {preparePlanData} from './preparePlanData';

interface StreamingQueryPlan {
    hasPlan: boolean;
    prepared?: PreparedQueryData['preparedPlan'];
}

function isPlanNode(value: unknown) {
    return Boolean(
        value &&
            typeof value === 'object' &&
            'Node Type' in value &&
            typeof (value as {'Node Type': unknown})['Node Type'] === 'string',
    );
}

function isStringList(value: unknown) {
    return (
        value === undefined || (Array.isArray(value) && value.every((i) => typeof i === 'string'))
    );
}

// The graph blocks render these fields directly, so anything else would throw while drawing.
function isRenderable(prepared: PreparedQueryData['preparedPlan']) {
    return (prepared?.nodes ?? []).every(({data}) => {
        return (
            (data?.name === undefined || typeof data.name === 'string') &&
            isStringList(data?.operators) &&
            isStringList(data?.tables)
        );
    });
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
        return isRenderable(prepared) ? {hasPlan: true, prepared} : {hasPlan: true};
    } catch {
        return {hasPlan: true};
    }
}
