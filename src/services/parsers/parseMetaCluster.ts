import type {TTraceView} from '../../types/api/trace';
import {traceViewSchema} from '../../types/api/trace';

export function parseTraceFields({traceView}: {traceView?: string}): {
    traceView?: TTraceView;
} {
    try {
        return {
            traceView: traceView ? traceViewSchema.parse(JSON.parse(traceView)) : undefined,
        };
    } catch (e) {
        console.error('Error parsing trace fields:', e);
    }

    return {};
}
