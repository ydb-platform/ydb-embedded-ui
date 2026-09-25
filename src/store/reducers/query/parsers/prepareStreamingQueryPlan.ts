import type {QueryPlan} from '../../../../types/api/query';
import type {PreparedQueryData} from '../types';

import {preparePlanData} from './preparePlanData';

// empty: nothing has been published yet; unparsed: a plan arrived but cannot be read,
// for instance truncated by the backend; unsupported: a readable plan of an unknown version.
export type StreamingQueryPlanState = 'empty' | 'unparsed' | 'unsupported' | 'ready';

interface StreamingQueryPlan {
    state: StreamingQueryPlanState;
    prepared?: PreparedQueryData['preparedPlan'];
}

function isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPlanNode(value: unknown) {
    return isObject(value) && typeof value['Node Type'] === 'string';
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
            (data?.id === undefined || typeof data.id === 'number') &&
            (data?.name === undefined || typeof data.name === 'string') &&
            isStringList(data?.operators) &&
            isStringList(data?.tables)
        );
    });
}

export function prepareStreamingQueryPlan(planText?: string): StreamingQueryPlan {
    if (!planText) {
        return {state: 'empty'};
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(planText);
    } catch {
        return {state: 'unparsed'};
    }

    if (!isObject(parsed) || !isObject(parsed.meta)) {
        return {state: 'empty'};
    }
    if (!parsed.Plan) {
        return {state: 'empty'};
    }
    if (!isPlanNode(parsed.Plan)) {
        return {state: 'unparsed'};
    }

    try {
        const {simplifiedPlan: _simplifiedPlan, ...prepared} = preparePlanData(
            parsed as unknown as QueryPlan,
        );
        if (!isRenderable(prepared)) {
            return {state: 'unparsed'};
        }
        return prepared.nodes?.length ? {state: 'ready', prepared} : {state: 'unsupported'};
    } catch {
        return {state: 'unparsed'};
    }
}
